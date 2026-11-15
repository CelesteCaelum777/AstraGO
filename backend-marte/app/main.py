from fastapi import FastAPI
from app.database import Base, engine
from app.routers import sites, stac, parameters, mars


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Planetary Analogue Explorer API",
    description="Backend para registrar y caracterizar sitios terrestres y descubrir datos geoespaciales STAC.",
    version="0.1.0",
)

app.include_router(sites.router, prefix="/api/v1")
app.include_router(stac.router, prefix="/api/v1")
app.include_router(parameters.router, prefix="/api/v1")
app.include_router(mars.router, prefix="/api/v1")


@app.get("/health", tags=["system"])
def health():
    return {"status": "ok", "service": "planetary-analogue-backend"}