from fastapi import APIRouter, HTTPException, Query
import httpx

from app.connectors.mars import MarsDataClient

router = APIRouter(
    prefix="/mars",
    tags=["Mars"]
)


@router.get("/meda/indexes")
async def get_meda_indexes():
    client = MarsDataClient()

    try:
        return await client.get_available_indexes()

    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Error consultando índices MEDA: {exc}"
        ) from exc


@router.get("/meda/products/{variable}")
async def get_meda_products(
    variable: str,
    limit: int = Query(default=5, ge=1, le=100)
):
    client = MarsDataClient()

    try:
        return await client.get_products(
            variable=variable,
            limit=limit
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        ) from exc

    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Error consultando productos MEDA: {exc}"
        ) from exc


@router.get("/meda/sample/{variable}/{sol}")
async def get_meda_sample(
    variable: str,
    sol: int,
    limit: int = Query(default=10, ge=1, le=500)
):
    client = MarsDataClient()

    try:
        return await client.get_sample(
            variable=variable,
            sol=sol,
            limit=limit
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        ) from exc

    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                f"El producto MEDA solicitado no está disponible "
                f"o la fuente respondió con error: {exc.response.status_code}"
            )
        ) from exc

    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Error descargando datos MEDA: {exc}"
        ) from exc


@router.get("/variables")
async def get_mars_variable_catalog():
    client = MarsDataClient()
    return client.get_variable_catalog()