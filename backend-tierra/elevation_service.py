"""Additive elevation lookup, local terrain sampling and weighted scoring.

Climatic scores and NASA requests remain in analog_service unchanged.
"""
from __future__ import annotations

import math
import time

import requests

from analog_service import PARAMETERS, _cache_get, _cache_put, score_similarity, search_regions

ELEVATION_URL = "https://api.open-meteo.com/v1/elevation"
TTL = 90 * 86400
ATTRIBUTION = "Copernicus DEM GLO-90 · Open-Meteo"


def fetch_elevations(coordinates):
    """One batched upstream request for uncached coordinates (maximum 100)."""
    if not coordinates or len(coordinates) > 100:
        raise ValueError("Se requieren entre 1 y 100 coordenadas.")
    for lat, lon in coordinates:
        if not (math.isfinite(lat) and math.isfinite(lon) and -90 <= lat <= 90 and -180 <= lon <= 180):
            raise ValueError("Coordenadas inválidas.")
    keys = [f"elevation:v1:{lat:.6f}:{lon:.6f}" for lat, lon in coordinates]
    cached = [_cache_get(key) for key in keys]
    missing = [i for i, item in enumerate(cached) if not item or time.time() - item[0] >= TTL]
    values = [item[1]["elevation"] if item else None for item in cached]
    stale = False
    if missing:
        # A cold/partial grid is fetched as one complete ordered batch (49 points).
        missing = list(range(len(coordinates)))
        try:
            response = requests.get(ELEVATION_URL, params={
                "latitude": ",".join(str(coordinates[i][0]) for i in missing),
                "longitude": ",".join(str(coordinates[i][1]) for i in missing),
            }, timeout=(4, 20))
            response.raise_for_status()
            elevations = response.json().get("elevation")
            if not isinstance(elevations, list) or len(elevations) != len(missing):
                raise ValueError("Open-Meteo devolvió una cantidad inesperada de altitudes.")
            if any(isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) for value in elevations):
                raise ValueError("Open-Meteo devolvió altitudes faltantes o inválidas.")
            for i, value in zip(missing, elevations):
                values[i] = float(value)
                _cache_put(keys[i], {"elevation": values[i]})
        except (requests.RequestException, ValueError):
            if any(values[i] is None for i in missing):
                raise
            stale = True
    return {"elevation": values, "source": ATTRIBUTION, "stale": stale}


def terrain_grid(lat, lon):
    latitudes = [round(max(-90, min(90, lat + offset * 0.02)), 6) for offset in range(-3, 4)]
    # Keep the plotted longitude axis continuous across the antimeridian.
    longitudes = [round(lon + offset * 0.02, 6) for offset in range(-3, 4)]
    coordinates = [(y, round((x + 180) % 360 - 180, 6)) for y in latitudes for x in longitudes]
    result = fetch_elevations(coordinates)
    values = result["elevation"]
    return {"latitude": lat, "longitude": lon, "latitudes": latitudes, "longitudes": longitudes,
            "z": [values[row * 7:(row + 1) * 7] for row in range(7)],
            "grid_size": 7, "step_degrees": 0.02, "source": result["source"], "stale": result["stale"]}


def search_with_elevation(targets, weights, min_similarity, mode):
    climate_targets = {key: targets[key] for key in PARAMETERS}
    climate_weights = {key: weights[key] for key in PARAMETERS}
    # Apply the threshold only after the seventh variable has been included.
    result = search_regions(climate_targets, climate_weights, 0, mode)
    candidates = result["results"]
    elevation = fetch_elevations([(r["lat"], r["lon"]) for r in candidates])
    climate_weight = sum(climate_weights.values())
    total_weight = climate_weight + weights["ELEVATION"]
    ranked = []
    for candidate, altitude in zip(candidates, elevation["elevation"]):
        climatic = score_similarity(candidate["values"], climate_targets, climate_weights)
        distance = min(1, abs(altitude - targets["ELEVATION"]) / 6000)
        similarity = 100 * (1 - ((1 - climatic / 100) * climate_weight + weights["ELEVATION"] * distance) / total_weight)
        ranked.append({**candidate, "values": {**candidate["values"], "ELEVATION": altitude},
                       "elevation_source": elevation["source"], "elevation_stale": elevation["stale"],
                       "climate_similarity": round(climatic, 2), "similarity": round(max(0, min(100, similarity)), 2)})
    return {**result, "results": sorted([r for r in ranked if r["similarity"] >= min_similarity], key=lambda r: r["similarity"], reverse=True)}
