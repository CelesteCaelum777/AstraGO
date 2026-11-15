from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class SiteCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    country: str | None = None
    radius_km: float = Field(default=5.0, gt=0, le=500)
    biome: str | None = None
    description: str | None = None

class SiteUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=200)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    country: str | None = None
    radius_km: float | None = Field(default=None, gt=0, le=500)
    biome: str | None = None
    description: str | None = None

class SiteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    country: str | None
    latitude: float
    longitude: float
    radius_km: float
    biome: str | None
    description: str | None
    created_at: datetime

class GeocodeCandidate(BaseModel):
    display_name: str
    latitude: float
    longitude: float
    osm_type: str | None = None
    osm_id: int | None = None

# ==========================================
# DIMENSIONES
# ==========================================

class DimensionCreate(BaseModel):
    code: str = Field(min_length=1, max_length=10)
    name: str = Field(min_length=2, max_length=200)
    description: str | None = None


class DimensionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    description: str | None
    active: bool


# ==========================================
# PARAMETROS
# ==========================================

class ParameterCreate(BaseModel):
    dimension_id: int
    code: str = Field(min_length=1, max_length=20)
    name: str = Field(min_length=2, max_length=200)
    description: str | None = None
    unit: str | None = None
    comparison_method: str | None = None
    data_type: str = "numeric"


class ParameterRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dimension_id: int
    code: str
    name: str
    description: str | None
    unit: str | None
    comparison_method: str | None
    data_type: str
    active: bool


# ==========================================
# FUENTES DE DATOS
# ==========================================

class ParameterSourceCreate(BaseModel):
    planetary_body: str
    source_name: str
    collection_id: str | None = None
    variable_name: str | None = None
    access_method: str | None = None
    source_url: str | None = None


class ParameterSourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    parameter_id: int
    planetary_body: str
    source_name: str
    collection_id: str | None
    variable_name: str | None
    access_method: str | None
    source_url: str | None
