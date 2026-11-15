
import math
import httpx

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import Site
from app.schemas import (
    SiteCreate,
    SiteRead,
    SiteUpdate,
    GeocodeCandidate,
)
from app.connectors.stac import STACClient
from app.science.catalog_classifier import classify_catalog


router = APIRouter(tags=["sites"])


# --------------------------------------------------
# CRUD: SITIOS TERRESTRES
# --------------------------------------------------

@router.post("/sites", response_model=SiteRead, status_code=201)
def create_site(payload: SiteCreate, db: Session = Depends(get_db)):
    site = Site(**payload.model_dump())
    db.add(site)
    db.commit()
    db.refresh(site)
    return site


@router.get("/sites", response_model=list[SiteRead])
def list_sites(
    q: str | None = Query(
        default=None,
        description="Filtra por nombre, país o bioma"
    ),
    db: Session = Depends(get_db),
):
    query = db.query(Site)

    if q:
        term = f"%{q}%"
        query = query.filter(
            or_(
                Site.name.ilike(term),
                Site.country.ilike(term),
                Site.biome.ilike(term),
            )
        )

    return query.order_by(Site.name.asc()).all()


@router.get("/sites/{site_id}", response_model=SiteRead)
def get_site(site_id: int, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Sitio no encontrado"
        )

    return site


@router.patch("/sites/{site_id}", response_model=SiteRead)
def update_site(
    site_id: int,
    payload: SiteUpdate,
    db: Session = Depends(get_db),
):
    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Sitio no encontrado"
        )

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(site, key, value)

    db.commit()
    db.refresh(site)

    return site


@router.delete("/sites/{site_id}", status_code=204)
def delete_site(site_id: int, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Sitio no encontrado"
        )

    db.delete(site)
    db.commit()

    return None


# --------------------------------------------------
# GEOCODIFICACIÓN: OPENSTREETMAP
# --------------------------------------------------

@router.get(
    "/places/geocode",
    response_model=list[GeocodeCandidate]
)
async def geocode_place(
    q: str = Query(min_length=2, max_length=200)
):
    """Busca lugares con OpenStreetMap Nominatim."""

    headers = {
        "User-Agent": "PlanetaryAnalogueExplorer/0.1 (research prototype)"
    }

    params = {
        "q": q,
        "format": "jsonv2",
        "limit": 5,
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params=params,
                headers=headers,
            )
            response.raise_for_status()
            items = response.json()

    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Error consultando el servicio de geocodificación: {exc}",
        ) from exc

    return [
        GeocodeCandidate(
            display_name=item["display_name"],
            latitude=float(item["lat"]),
            longitude=float(item["lon"]),
            osm_type=item.get("osm_type"),
            osm_id=item.get("osm_id"),
        )
        for item in items
    ]


# --------------------------------------------------
# CATÁLOGO CIENTÍFICO: CLASIFICACIÓN DE COLECCIONES
# --------------------------------------------------

@router.get("/sites/{site_id}/available-data")
async def get_available_data(
    site_id: int,
    db: Session = Depends(get_db),
):
    """Identifica colecciones candidatas para los parámetros científicos."""

    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Sitio no encontrado"
        )

    try:
        collections = await STACClient().collections()
        classified = classify_catalog(collections)

    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Error consultando el catálogo STAC: {exc}",
        ) from exc

    parameters = []

    for key, data in classified.items():
        parameters.append({
            "parameter": key,
            "label": data["label"],
            "candidate_collections": data["count"],
            "collections": data["collections"],
            "status": (
                "candidate_found"
                if data["count"] > 0
                else "not_found"
            ),
        })

    return {
        "site": {
            "id": site.id,
            "name": site.name,
            "country": site.country,
            "biome": site.biome,
            "latitude": site.latitude,
            "longitude": site.longitude,
        },
        "catalog_source": "EarthCODE STAC API",
        "total_collections_reviewed": len(collections),
        "parameters": parameters,
        "notice": (
            "Los resultados son candidatos identificados por metadatos. "
            "No confirman disponibilidad espacial ni idoneidad científica."
        ),
    }


# --------------------------------------------------
# BÚSQUEDA ESPACIAL: CÁLCULO DEL BBOX
# --------------------------------------------------

def build_site_bboxes(
    latitude: float,
    longitude: float,
    radius_km: float,
):
    """
    Calcula el área rectangular aproximada del sitio.
    Orden STAC: west, south, east, north.
    """

    if not -90 <= latitude <= 90:
        raise ValueError("Latitud fuera de rango")

    if not -180 <= longitude <= 180:
        raise ValueError("Longitud fuera de rango")

    if radius_km <= 0:
        raise ValueError("El radio debe ser mayor que cero")

    lat_delta = radius_km / 111.32

    south = max(-90, latitude - lat_delta)
    north = min(90, latitude + lat_delta)

    cos_lat = abs(math.cos(math.radians(latitude)))

    if cos_lat < 1e-8:
        return [[-180, south, 180, north]]

    lon_delta = radius_km / (111.32 * cos_lat)

    # El área abarca todas las longitudes.
    if lon_delta >= 180:
        return [[-180, south, 180, north]]

    west = longitude - lon_delta
    east = longitude + lon_delta

    # Cruce del meridiano 180°.
    if west < -180:
        return [
            [west + 360, south, 180, north],
            [-180, south, east, north],
        ]

    if east > 180:
        return [
            [west, south, 180, north],
            [-180, south, east - 360, north],
        ]

    return [[west, south, east, north]]


# --------------------------------------------------
# BÚSQUEDA DE ITEMS STAC PARA UN SITIO
# --------------------------------------------------

@router.get("/sites/{site_id}/data-items")
async def search_site_data_items(
    site_id: int,
    datetime_range: str | None = Query(
        default=None,
        alias="datetime",
        description=(
            "Ej.: 2023-01-01T00:00:00Z/"
            "2023-12-31T23:59:59Z"
        ),
    ),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Busca Items STAC en el área geográfica del sitio."""

    site = db.query(Site).filter(Site.id == site_id).first()

    if not site:
        raise HTTPException(
            status_code=404,
            detail="Sitio no encontrado"
        )

    try:
        bboxes = build_site_bboxes(
            site.latitude,
            site.longitude,
            site.radius_km,
        )

        stac = STACClient()
        all_features = []
        matched = 0

        for bbox in bboxes:
            result = await stac.search(
                bbox=bbox,
                datetime_range=datetime_range,
                limit=limit,
            )

            matched += result.get("numberMatched") or 0
            all_features.extend(result.get("features", []))

        # Eliminar duplicados.
        unique_features = {}

        for feature in all_features:
            key = (
                feature.get("collection"),
                feature.get("id"),
            )
            unique_features[key] = feature

        items = []

        for feature in unique_features.values():
            properties = feature.get("properties", {})

            assets = []

            for asset_key, asset in feature.get("assets", {}).items():
                assets.append({
                    "key": asset_key,
                    "title": asset.get("title"),
                    "description": asset.get("description"),
                    "type": asset.get("type"),
                    "roles": asset.get("roles", []),
                    "href": asset.get("href"),
                })

            items.append({
                "id": feature.get("id"),
                "collection": feature.get("collection"),
                "datetime": properties.get("datetime"),
                "start_datetime": properties.get("start_datetime"),
                "end_datetime": properties.get("end_datetime"),
                "geometry": feature.get("geometry"),
                "bbox": feature.get("bbox"),
                "assets": assets,
                "links": feature.get("links", []),
            })

        return {
            "site": {
                "id": site.id,
                "name": site.name,
                "latitude": site.latitude,
                "longitude": site.longitude,
                "radius_km": site.radius_km,
            },
            "search": {
                "bboxes": bboxes,
                "datetime": datetime_range,
                "limit_per_bbox": limit,
            },
            "number_matched": matched,
            "number_returned": len(items),
            "items": items,
        }

    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Error buscando datos para el sitio: {exc}",
        ) from exc
