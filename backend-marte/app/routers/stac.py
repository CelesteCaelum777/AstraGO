from fastapi import APIRouter, HTTPException, Query
from app.connectors.stac import STACClient
import httpx

router = APIRouter(prefix="/stac", tags=["stac"])

@router.get("/collections")
async def list_stac_collections():
    try:
        collections = await STACClient().collections()
        return {"count": len(collections), "collections": collections}
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"No se pudieron consultar las colecciones STAC: {exc}") from exc

@router.get("/search")
async def search_stac(
    west: float = Query(ge=-180, le=180),
    south: float = Query(ge=-90, le=90),
    east: float = Query(ge=-180, le=180),
    north: float = Query(ge=-90, le=90),
    datetime_range: str | None = Query(default=None, alias="datetime", description="Ej.: 2023-01-01T00:00:00Z/2023-12-31T23:59:59Z"),
    limit: int = Query(default=20, ge=1, le=100),
):
    if west >= east or south >= north:
        raise HTTPException(status_code=422, detail="BBox inválido: se requiere west < east y south < north")
    try:
        result = await STACClient().search([west, south, east, north], datetime_range, limit)
        return {
            "numberMatched": result.get("numberMatched"),
            "numberReturned": result.get("numberReturned", len(result.get("features", []))),
            "features": result.get("features", []),
            "context": result.get("context"),
        }
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"Error en la búsqueda STAC: {exc}") from exc
