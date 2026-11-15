from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from app.database import Base
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Text,
    Boolean,
    ForeignKey,
)

class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    country = Column(String(120), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_km = Column(Float, nullable=False, default=5.0)
    biome = Column(String(120), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Dimension(Base):
    __tablename__ = "dimensions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)


class Parameter(Base):
    __tablename__ = "parameters"

    id = Column(Integer, primary_key=True, index=True)
    dimension_id = Column(
        Integer,
        ForeignKey("dimensions.id"),
        nullable=False
    )
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    unit = Column(String(50), nullable=True)
    comparison_method = Column(String(100), nullable=True)
    data_type = Column(String(50), default="numeric", nullable=False)
    active = Column(Boolean, default=True, nullable=False)


class ParameterSource(Base):
    __tablename__ = "parameter_sources"

    id = Column(Integer, primary_key=True, index=True)
    parameter_id = Column(
        Integer,
        ForeignKey("parameters.id"),
        nullable=False
    )
    planetary_body = Column(String(50), nullable=False)
    source_name = Column(String(200), nullable=False)
    collection_id = Column(String(200), nullable=True)
    variable_name = Column(String(200), nullable=True)
    access_method = Column(String(100), nullable=True)
    source_url = Column(String(500), nullable=True)