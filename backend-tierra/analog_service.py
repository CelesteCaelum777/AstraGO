from __future__ import annotations

import math
import json
import os
import sqlite3
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, Iterable, List, Tuple

import requests

NASA_POWER_BASE = "https://power.larc.nasa.gov/api/temporal/climatology/point"

PARAMETERS = [
    "T2M",
    "T2M_MIN",
    "ALLSKY_SFC_SW_DWN",
    "WS10M",
    "PRECTOTCORR",
    "RH2M",
]

DEFAULT_MARS_TARGETS = {
    "T2M": -60.0,
    "T2M_MIN": -80.0,
    "ALLSKY_SFC_SW_DWN": 6.5,
    "WS10M": 5.0,
    "PRECTOTCORR": 0.0,
    "RH2M": 25.0,
}

# Ranges used for normalization. These are intentionally broad enough to compare
# Earth analogs with Martian extremes without forcing unrealistic values to 1.
RANGE_LIMITS = {
    "T2M": (-90.0, 60.0),
    "T2M_MIN": (-100.0, 40.0),
    "ALLSKY_SFC_SW_DWN": (0.0, 12.0),
    "WS10M": (0.0, 25.0),
    "PRECTOTCORR": (0.0, 25.0),
    "RH2M": (0.0, 100.0),
}

REGION_SEED_DATA = [
    {
        "name": "Atacama",
        "country": "Chile",
        "lat": -23.5,
        "lon": -69.9,
        "values": {
            "T2M": 15.0,
            "T2M_MIN": 6.0,
            "ALLSKY_SFC_SW_DWN": 6.2,
            "WS10M": 6.2,
            "PRECTOTCORR": 0.5,
            "RH2M": 25.0,
        },
    },
    {
        "name": "McMurdo",
        "country": "Antarctica",
        "lat": -77.85,
        "lon": 166.67,
        "values": {
            "T2M": -18.0,
            "T2M_MIN": -26.0,
            "ALLSKY_SFC_SW_DWN": 4.2,
            "WS10M": 8.5,
            "PRECTOTCORR": 1.4,
            "RH2M": 68.0,
        },
    },
    {
        "name": "Mojave",
        "country": "USA",
        "lat": 35.6,
        "lon": -116.0,
        "values": {
            "T2M": 21.0,
            "T2M_MIN": 8.0,
            "ALLSKY_SFC_SW_DWN": 7.4,
            "WS10M": 3.8,
            "PRECTOTCORR": 0.1,
            "RH2M": 18.0,
        },
    },
    {
        "name": "Sahara",
        "country": "Algeria",
        "lat": 23.0,
        "lon": 10.0,
        "values": {
            "T2M": 29.0,
            "T2M_MIN": 16.0,
            "ALLSKY_SFC_SW_DWN": 7.9,
            "WS10M": 5.0,
            "PRECTOTCORR": 0.0,
            "RH2M": 12.0,
        },
    },
    {
        "name": "Río Tinto",
        "country": "Spain",
        "lat": 37.7,
        "lon": -6.5,
        "values": {
            "T2M": 18.0,
            "T2M_MIN": 10.0,
            "ALLSKY_SFC_SW_DWN": 5.8,
            "WS10M": 4.0,
            "PRECTOTCORR": 0.7,
            "RH2M": 45.0,
        },
    },
    {
        "name": "Islandia",
        "country": "Iceland",
        "lat": 64.96,
        "lon": -18.54,
        "values": {
            "T2M": 4.2,
            "T2M_MIN": -2.0,
            "ALLSKY_SFC_SW_DWN": 2.8,
            "WS10M": 8.1,
            "PRECTOTCORR": 2.4,
            "RH2M": 70.0,
        },
    },
    {
        "name": "Altiplano",
        "country": "Bolivia",
        "lat": -16.5,
        "lon": -68.1,
        "values": {
            "T2M": 9.5,
            "T2M_MIN": 0.8,
            "ALLSKY_SFC_SW_DWN": 5.9,
            "WS10M": 5.7,
            "PRECTOTCORR": 1.3,
            "RH2M": 46.0,
        },
    },
]


def normalize_value(name: str, value: float) -> float:
    low, high = RANGE_LIMITS.get(name, (0.0, 1.0))
    span = high - low
    if span == 0:
        return 0.0
    return max(0.0, min(1.0, abs(value) / max(abs(span), 1e-6)))


def build_default_targets() -> Dict[str, float]:
    return DEFAULT_MARS_TARGETS.copy()


def build_default_weights() -> Dict[str, int]:
    return {
        "T2M": 9,
        "T2M_MIN": 9,
        "ALLSKY_SFC_SW_DWN": 8,
        "WS10M": 5,
        "PRECTOTCORR": 4,
        "RH2M": 6,
    }


def score_similarity(point_values: Dict[str, float], targets: Dict[str, float], weights: Dict[str, int]) -> float:
    total_weight = sum(weights.get(key, 1) for key in PARAMETERS)
    if total_weight == 0:
        return 0.0

    numerator = 0.0
    for key in PARAMETERS:
        target = float(targets.get(key, 0.0))
        actual = float(point_values.get(key, 0.0))
        low, high = RANGE_LIMITS.get(key, (0.0, 1.0))
        span = high - low
        if span == 0:
            diff = 0.0
        else:
            diff = abs(actual - target) / span
        diff = max(0.0, min(1.0, diff))
        numerator += weights.get(key, 1) * diff

    similarity = (1.0 - (numerator / total_weight)) * 100.0
    return max(0.0, min(100.0, similarity))


CACHE_PATH = Path(os.environ.get("POWER_CACHE_PATH", Path(__file__).parent / ".cache/power.sqlite3"))
CACHE_TTL = 30 * 86400


def _cache_get(key):
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(CACHE_PATH) as db:
        db.execute("CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, created REAL, body TEXT)")
        row = db.execute("SELECT created, body FROM cache WHERE key=?", (key,)).fetchone()
    if row:
        return row[0], json.loads(row[1])
    return None


def _cache_put(key, body):
    with sqlite3.connect(CACHE_PATH) as db:
        db.execute("INSERT OR REPLACE INTO cache VALUES (?, ?, ?)", (key, time.time(), json.dumps(body)))


def _power_request(lat: float, lon: float, params: Iterable[str]) -> Dict[str, Any]:
    response = requests.get(NASA_POWER_BASE, params={
        "parameters": ",".join(params), "community": "AG",
        "longitude": lon, "latitude": lat, "format": "JSON",
    }, timeout=(4, 12))
    response.raise_for_status()
    return response.json()


def parse_power_values(data):
    """Use annual climatology, excluding NASA fill values; never substitute zero."""
    rows = data.get("properties", {}).get("parameter", {})
    fill = data.get("header", {}).get("fill_value", -999)
    result = {}
    for key in PARAMETERS:
        row = rows.get(key, {})
        def valid(v):
            return isinstance(v, (int, float)) and math.isfinite(v) and v not in (fill, -999)
        if valid(row.get("ANN")):
            result[key] = float(row["ANN"])
        else:
            monthly = [float(row[m]) for m in ("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC") if valid(row.get(m))]
            if len(monthly) != 12:
                raise ValueError(f"Incomplete climatology: {key}")
            result[key] = sum(monthly) / 12
    return result


def fetch_power_point(lat: float, lon: float) -> Dict[str, Any]:
    if not (math.isfinite(lat) and math.isfinite(lon) and -90 <= lat <= 90 and -180 <= lon <= 180):
        raise ValueError("Invalid coordinates")
    key = f"climatology:{lat:.5f}:{lon:.5f}"
    cached = _cache_get(key)
    if cached and time.time() - cached[0] < CACHE_TTL:
        return {**cached[1], "source": "NASA POWER · caché", "cached_at": cached[0]}
    try:
        data = _power_request(lat, lon, PARAMETERS)
        item = {"lat": lat, "lon": lon, "values": parse_power_values(data),
                "source": "NASA POWER", "period": data.get("header", {}).get("range"),
                "parameters": data.get("parameters", {}), "fetched_at": time.time()}
        _cache_put(key, item)
        return item
    except (requests.RequestException, ValueError, KeyError):
        if cached:
            return {**cached[1], "source": "NASA POWER · caché vencida", "stale": True}
        raise


def search_regions(targets, weights, min_similarity, mode="live"):
    def load(region):
        item = {**region, "source": "Demostración · valores ilustrativos", "demo": True}
        if mode == "live":
            try:
                item.update(fetch_power_point(region["lat"], region["lon"]))
                item["demo"] = False
            except (requests.RequestException, ValueError, OSError):
                item["warning"] = "NASA no disponible; se utilizan valores ilustrativos."
        item["id"] = f"{region['lat']},{region['lon']}"
        item["similarity"] = round(score_similarity(item["values"], targets, weights), 2)
        return item
    with ThreadPoolExecutor(max_workers=3) as pool:
        items = list(pool.map(load, REGION_SEED_DATA))
    return {"results": sorted([i for i in items if i["similarity"] >= min_similarity], key=lambda i: i["similarity"], reverse=True),
            "demo_count": sum(i["demo"] for i in items), "evaluated_count": len(items)}


def build_seed_results(targets: Dict[str, float], weights: Dict[str, int]) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    for region in REGION_SEED_DATA:
        values = region["values"]
        similarity = score_similarity(values, targets, weights)
        results.append(
            {
                "id": f"{region['lat']},{region['lon']}",
                "name": region["name"],
                "country": region["country"],
                "lat": region["lat"],
                "lon": region["lon"],
                "similarity": round(similarity, 2),
                "values": values,
            }
        )
    return sorted(results, key=lambda item: item["similarity"], reverse=True)


def build_region_grid_for_search(targets: Dict[str, float], weights: Dict[str, int], min_similarity: float) -> List[Dict[str, Any]]:
    """Create a broad Earth search grid from known analog seeds and live NASA POWER snaps.

    This keeps the app responsive and avoids thousands of API calls in one pass.
    """
    results = build_seed_results(targets, weights)
    return [item for item in results if item["similarity"] >= min_similarity]
