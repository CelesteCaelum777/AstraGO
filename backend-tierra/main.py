from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Literal
from urllib.parse import urlparse

import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, ConfigDict, model_validator

from analog_service import (
    PARAMETERS, RANGE_LIMITS, REGION_SEED_DATA, build_default_targets, build_default_weights,
    fetch_power_point, search_regions,
)

from elevation_service import fetch_elevations, terrain_grid, search_with_elevation

ROOT = Path(__file__).parent
app = FastAPI(title="Planetary Analog Search", version="1.1.0")
# Public read/search API: no cookies or browser credentials are required.
# Restrict origins with a comma-separated API_CORS_ORIGINS environment variable.
CORS_ORIGINS = [origin.strip() for origin in os.environ.get("API_CORS_ORIGINS", "*").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Accept"],
)
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")
VISUALIZATIONS = ["heatmaps", "variables", "trend", "anomalies", "cycles", "zones", "gardening", "psychrometric"]


class SearchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    targets: dict[str, float] = Field(default_factory=build_default_targets)
    weights: dict[str, int] = Field(default_factory=build_default_weights)
    min_similarity: float = Field(default=75, ge=0, le=100)
    mode: Literal["live", "demo"] = "live"

    @model_validator(mode="after")
    def validate_parameters(self):
        allowed = [set(PARAMETERS), set(PARAMETERS) | {"ELEVATION"}]
        if set(self.targets) not in allowed or set(self.weights) != set(self.targets):
            raise ValueError("Se requieren las seis variables climáticas y, opcionalmente, ELEVATION en objetivos y pesos.")
        if "ELEVATION" in self.targets and not 0 <= self.targets["ELEVATION"] <= 6000:
            raise ValueError("El objetivo ELEVATION debe estar entre 0 y 6000 metros.")
        if any(not 1 <= w <= 10 for w in self.weights.values()):
            raise ValueError("Los pesos deben estar entre 1 y 10.")
        return self


@app.get("/", response_class=HTMLResponse)
def root():
    return HTMLResponse((ROOT / "index.html").read_text(encoding="utf-8"))


@app.get("/health")
def health():
    return {"status": "ok", "service": "planetary-analog-search"}


@app.get("/api/config", tags=["Integración"], summary="Configuración para frontends externos")
def api_config():
    units = {
        "T2M": "°C", "T2M_MIN": "°C", "ALLSKY_SFC_SW_DWN": "kW-hr/m²/day",
        "WS10M": "m/s", "PRECTOTCORR": "mm/day", "RH2M": "%",
    }
    labels = {
        "T2M": "Temperatura promedio", "T2M_MIN": "Temperatura mínima",
        "ALLSKY_SFC_SW_DWN": "Radiación solar", "WS10M": "Velocidad del viento",
        "PRECTOTCORR": "Precipitación diaria", "RH2M": "Humedad relativa",
    }
    return {
        "api_version": app.version,
        "parameters": [{"key": key, "label": labels[key], "unit": units[key],
                        "normalization_range": list(RANGE_LIMITS[key])} for key in PARAMETERS],
        "defaults": SearchRequest().model_dump(),
        "optional_parameters": [{"key": "ELEVATION", "label": "Elevación / Altitud del Terreno",
                                 "unit": "m", "normalization_range": [0, 6000], "step": 10,
                                 "default_target": 2500, "default_weight": 6}],
        "constraints": {"weight_min": 1, "weight_max": 10, "min_similarity_min": 0,
                        "min_similarity_max": 100, "required_parameters": PARAMETERS},
        "modes": ["live", "demo"],
        "coverage": {"type": "known_regions", "region_count": len(REGION_SEED_DATA)},
        "endpoints": {"search": "/api/search", "regions": "/api/regions",
                      "power_point": "/api/power-point", "elevation": "/api/elevation",
                      "terrain": "/api/terrain", "health": "/health",
                      "openapi": "/openapi.json", "docs": "/docs"},
    }


@app.get("/api/regions")
def regions():
    return {"regions": REGION_SEED_DATA, "source": "Valores ilustrativos; no son observaciones NASA verificadas"}


@app.post("/api/search")
def search(request: SearchRequest):
    # Sync routes run in FastAPI's thread pool, keeping the event loop responsive.
    try:
        result = (search_with_elevation(request.targets, request.weights, request.min_similarity, request.mode)
                  if "ELEVATION" in request.targets else
                  search_regions(request.targets, request.weights, request.min_similarity, request.mode))
    except (requests.RequestException, ValueError, OSError) as exc:
        raise HTTPException(502, "No se pudo obtener la elevación de Open-Meteo. Reintente la búsqueda; no se usaron altitudes inventadas.") from exc
    return {**result,
            "targets": request.targets, "weights": request.weights, "min_similarity": request.min_similarity}


@app.get("/api/power-point")
def power_point(lat: float = Query(ge=-90, le=90), lon: float = Query(ge=-180, le=180)):
    try:
        return fetch_power_point(lat, lon)
    except (requests.RequestException, ValueError, OSError) as exc:
        raise HTTPException(502, "NASA POWER no disponible o datos incompletos.") from exc


@app.get("/api/elevation", tags=["Topografía"])
def elevation_point(lat: float = Query(ge=-90, le=90, allow_inf_nan=False), lon: float = Query(ge=-180, le=180, allow_inf_nan=False)):
    try:
        return {"lat": lat, "lon": lon, **fetch_elevations([(lat, lon)])}
    except (requests.RequestException, ValueError, OSError) as exc:
        raise HTTPException(502, "Open-Meteo no disponible o altitud inválida.") from exc


@app.get("/api/terrain", tags=["Topografía"])
def terrain(lat: float = Query(ge=-90, le=90, allow_inf_nan=False), lon: float = Query(ge=-180, le=180, allow_inf_nan=False)):
    try:
        return terrain_grid(lat, lon)
    except (requests.RequestException, ValueError, OSError) as exc:
        raise HTTPException(502, "No se pudo obtener la grilla topográfica de Open-Meteo.") from exc


def toolkit_templates():
    try:
        raw = json.loads(os.environ.get("POWER_TOOLKIT_URLS", "{}"))
        return {key: value for key, value in raw.items() if key in VISUALIZATIONS and
                isinstance(value, str) and urlparse(value).scheme == "https" and
                urlparse(value).hostname == "power.larc.nasa.gov"}
    except (ValueError, AttributeError):
        return {}


@app.get("/api/toolkit-config")
def toolkit_config():
    url = os.environ.get("POWER_TOOLKIT_CONFIG_URL")
    status = "unconfigured"
    if url and urlparse(url).scheme == "https" and urlparse(url).hostname == "power.larc.nasa.gov":
        try:
            response = requests.get(url, timeout=(3, 5))
            response.raise_for_status()
            response.json()
            status = "available"
        except (requests.RequestException, ValueError):
            status = "unavailable"
    return {"status": status, "templates": toolkit_templates(), "available_visualizations": VISUALIZATIONS,
            "viewer_url": "https://power.larc.nasa.gov/data-access-viewer/"}
