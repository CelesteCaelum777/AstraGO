import os
import httpx

DEFAULT_STAC_URL = "https://eoapi.workspace.earthcode.eox.at/stac"

class STACClient:
    """Cliente mínimo STAC API: descubre colecciones y busca Items."""

    def __init__(self, base_url: str | None = None):
        self.base_url = (base_url or os.getenv("STAC_API_URL", DEFAULT_STAC_URL)).rstrip("/")

    async def _get(self, path: str, params: dict | None = None):
        async with httpx.AsyncClient(timeout=45, follow_redirects=True) as client:
            response = await client.get(f"{self.base_url}{path}", params=params)
            response.raise_for_status()
            return response.json()

    async def collections(self):
        data = await self._get("/collections")
        return data.get("collections", [])

    async def search(self, bbox: list[float], datetime_range: str | None = None, limit: int = 20):
        # STAC bbox order: west, south, east, north
        payload = {"bbox": bbox, "limit": limit}
        if datetime_range:
            payload["datetime"] = datetime_range
        async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
            response = await client.post(f"{self.base_url}/search", json=payload)
            response.raise_for_status()
            return response.json()
