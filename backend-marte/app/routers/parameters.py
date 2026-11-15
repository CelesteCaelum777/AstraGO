
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Dimension, Parameter, ParameterSource
from app.schemas import (
    DimensionCreate,
    DimensionRead,
    ParameterCreate,
    ParameterRead,
    ParameterSourceCreate,
    ParameterSourceRead,
)

router = APIRouter(
    prefix="/parameters",
    tags=["parameters"]
)


# ==========================================
# DIMENSIONES
# ==========================================

@router.get("/dimensions", response_model=list[DimensionRead])
def list_dimensions(db: Session = Depends(get_db)):
    return db.query(Dimension).order_by(Dimension.id).all()


# ==========================================
# PARAMETROS
# ==========================================

@router.get("/", response_model=list[ParameterRead])
def list_parameters(
    dimension_id: int | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Parameter)

    if dimension_id is not None:
        query = query.filter(Parameter.dimension_id == dimension_id)

    return query.order_by(Parameter.id).all()


@router.get("/{parameter_id}", response_model=ParameterRead)
def get_parameter(
    parameter_id: int,
    db: Session = Depends(get_db)
):
    parameter = db.query(Parameter).filter(
        Parameter.id == parameter_id
    ).first()

    if not parameter:
        raise HTTPException(
            status_code=404,
            detail="Parámetro no encontrado"
        )

    return parameter


@router.post("/", response_model=ParameterRead, status_code=201)
def create_parameter(
    payload: ParameterCreate,
    db: Session = Depends(get_db)
):
    dimension = db.query(Dimension).filter(
        Dimension.id == payload.dimension_id
    ).first()

    if not dimension:
        raise HTTPException(
            status_code=404,
            detail="Dimensión no encontrada"
        )

    existing = db.query(Parameter).filter(
        Parameter.code == payload.code
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Ya existe un parámetro con ese código"
        )

    parameter = Parameter(**payload.model_dump())

    db.add(parameter)
    db.commit()
    db.refresh(parameter)

    return parameter


# ==========================================
# FUENTES DE DATOS
# ==========================================

@router.post(
    "/{parameter_id}/sources",
    response_model=ParameterSourceRead,
    status_code=201
)
def create_parameter_source(
    parameter_id: int,
    payload: ParameterSourceCreate,
    db: Session = Depends(get_db)
):
    parameter = db.query(Parameter).filter(
        Parameter.id == parameter_id
    ).first()

    if not parameter:
        raise HTTPException(
            status_code=404,
            detail="Parámetro no encontrado"
        )

    source = ParameterSource(
        parameter_id=parameter_id,
        **payload.model_dump()
    )

    db.add(source)
    db.commit()
    db.refresh(source)

    return source


@router.get(
    "/{parameter_id}/sources",
    response_model=list[ParameterSourceRead]
)
def list_parameter_sources(
    parameter_id: int,
    db: Session = Depends(get_db)
):
    parameter = db.query(Parameter).filter(
        Parameter.id == parameter_id
    ).first()

    if not parameter:
        raise HTTPException(
            status_code=404,
            detail="Parámetro no encontrado"
        )

    return db.query(ParameterSource).filter(
        ParameterSource.parameter_id == parameter_id
    ).all()
@router.post(
    "/dimensions",
    response_model=DimensionRead,
    status_code=201
)
def create_dimension(
    payload: DimensionCreate,
    db: Session = Depends(get_db)
):
    existing = db.query(Dimension).filter(
        Dimension.code == payload.code
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Ya existe una dimensión con ese código"
        )

    dimension = Dimension(**payload.model_dump())

    db.add(dimension)
    db.commit()
    db.refresh(dimension)

    return dimension