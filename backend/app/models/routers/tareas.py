from fastapi import APIRouter, Query, HTTPException, Depends
from typing import List, Optional
from sqlalchemy.orm import Session

from app.schemas.tarea import (
    TareaResponse,
    EstadoServicio,
    TareaCreate,
    TareaUpdateEstado,
    TareaReasignar
)

from app.db.session import SessionLocal
from app.models.tarea import Tarea
from app.models.empleado import EmpleadoTarea

router = APIRouter(prefix="/tareas", tags=["Tareas"])


# 🔹 DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 🔹 GET /tareas
@router.get("/", response_model=List[TareaResponse])
def get_tareas(
    estado: Optional[str] = Query(None),
    id_tecnico: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Tarea)

    if estado:
        query = query.filter(Tarea.estado_tarea == estado)

    tareas = query.all()

    # 🔸 filtro por técnico (relación)
    if id_tecnico:
        tareas = [
            t for t in tareas
            if any(et.id_empleado == id_tecnico for et in t.empleados)
        ]

    return tareas


# 🔹 POST /tareas
@router.post("/", response_model=TareaResponse)
def create_tarea(
    tarea: TareaCreate,
    db: Session = Depends(get_db)
):
    nueva_tarea = Tarea(
        titulo=tarea.nombre,
        descripcion=tarea.descripcion,
        direccion_servicio=tarea.direccion,
        prioridad=tarea.prioridad,
        estado_tarea="pendiente"
    )

    db.add(nueva_tarea)
    db.commit()
    db.refresh(nueva_tarea)

    # 🔹 asignar técnico si viene
    if tarea.id_tecnico:
        asignacion = EmpleadoTarea(
            id_empleado=tarea.id_tecnico,
            id_tarea=nueva_tarea.id_tarea
        )
        db.add(asignacion)
        db.commit()

    return nueva_tarea


# 🔹 PATCH /tareas/{id}/estado
@router.patch("/{id}/estado", response_model=TareaResponse)
def update_estado(
    id: int,
    data: TareaUpdateEstado,
    db: Session = Depends(get_db)
):
    tarea = db.query(Tarea).filter(Tarea.id_tarea == id).first()

    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    tarea.estado_tarea = data.estado

    db.commit()
    db.refresh(tarea)

    return tarea


# 🔹 PATCH /tareas/{id}/reasignar
@router.patch("/{id}/reasignar", response_model=TareaResponse)
def reasignar_tarea(
    id: int,
    data: TareaReasignar,
    db: Session = Depends(get_db)
):
    tarea = db.query(Tarea).filter(Tarea.id_tarea == id).first()

    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    # 🔹 eliminar asignaciones anteriores
    db.query(EmpleadoTarea).filter(
        EmpleadoTarea.id_tarea == id
    ).delete()

    # 🔹 nueva asignación
    nueva_asignacion = EmpleadoTarea(
        id_empleado=data.id_tecnico,
        id_tarea=id
    )

    db.add(nueva_asignacion)
    db.commit()

    return tarea