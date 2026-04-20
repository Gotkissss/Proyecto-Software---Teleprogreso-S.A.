from fastapi import APIRouter, Query, HTTPException, Depends
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import date
from app.api.deps import get_current_empleado
from app.models.empleado import Empleado

from app.schemas.tarea import (
    TareaResponse,
    TareaCreate,
    TareaUpdateEstado,
    TareaReasignar
)

from app.db.session import get_db
from app.models.tarea import Tarea
from app.models.empleado import EmpleadoTarea

router = APIRouter(prefix="/tareas", tags=["Tareas"])


# 🔹 GET /tareas
@router.get("/", response_model=List[TareaResponse])
async def get_tareas(
    estado: Optional[str] = Query(None),
    id_tecnico: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(Tarea)

    if estado:
        query = query.where(Tarea.estado_tarea == estado)

    result = await db.execute(query)
    tareas = result.scalars().all()

    # 🔸 filtro por técnico (relación)
    if id_tecnico:
        tareas = [
            t for t in tareas
            if any(et.id_empleado == id_tecnico for et in t.empleados)
        ]

    return tareas


# 🔹 POST /tareas
@router.post("/", response_model=TareaResponse)
async def create_tarea(
    tarea: TareaCreate,
    db: AsyncSession = Depends(get_db)
):
    nueva_tarea = Tarea(
        titulo=tarea.nombre,
        descripcion=tarea.descripcion,
        direccion_servicio=tarea.direccion,
        prioridad=tarea.prioridad,
        estado_tarea="pendiente"
    )

    db.add(nueva_tarea)
    await db.flush()  # 🔥 necesario para obtener ID

    # 🔹 asignar técnico si viene
    if tarea.id_tecnico:
        asignacion = EmpleadoTarea(
            id_empleado=tarea.id_tecnico,
            id_tarea=nueva_tarea.id_tarea
        )
        db.add(asignacion)

    return nueva_tarea


# 🔹 PATCH /tareas/{id}/estado
@router.patch("/{id}/estado", response_model=TareaResponse)
async def update_estado(
    id: int,
    data: TareaUpdateEstado,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Tarea).where(Tarea.id_tarea == id)
    )
    tarea = result.scalar_one_or_none()

    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    tarea.estado_tarea = data.estado

    return tarea


# 🔹 PATCH /tareas/{id}/reasignar
@router.patch("/{id}/reasignar", response_model=TareaResponse)
async def reasignar_tarea(
    id: int,
    data: TareaReasignar,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Tarea).where(Tarea.id_tarea == id)
    )
    tarea = result.scalar_one_or_none()

    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    # 🔹 eliminar asignaciones anteriores
    await db.execute(
        delete(EmpleadoTarea).where(EmpleadoTarea.id_tarea == id)
    )

    # 🔹 nueva asignación
    nueva_asignacion = EmpleadoTarea(
        id_empleado=data.id_tecnico,
        id_tarea=id
    )

    db.add(nueva_asignacion)

    return tarea

@router.patch("/{id}/iniciar")
async def iniciar_tarea(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Empleado = Depends(get_current_empleado),
):
    # 1. Buscar la tarea
    result = await db.execute(
        select(Tarea).where(Tarea.id_tarea == id)
    )
    tarea = result.scalar_one_or_none()

    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    # 2. Validar que el técnico esté asignado
    result = await db.execute(
        select(EmpleadoTarea).where(
            EmpleadoTarea.id_tarea == id,
            EmpleadoTarea.id_empleado == current_user.id_empleado
        )
    )
    asignacion = result.scalar_one_or_none()

    if not asignacion:
        raise HTTPException(
            status_code=403,
            detail="No tienes permiso para iniciar esta tarea"
        )

    # 3. Validar que no esté iniciada
    if tarea.fecha_inicio is not None:
        raise HTTPException(
            status_code=400,
            detail="La tarea ya fue iniciada"
        )

    # 4. Registrar inicio
    tarea.fecha_inicio = date.today()

    return {
        "message": "Tarea iniciada correctamente",
        "id_tarea": tarea.id_tarea
    }