# backend/app/routers/tareas.py
"""
Router de Tareas — Teleprogreso S.A.
-------
Este archivo gestiona el ciclo de vida de las tareas/ordenes de servicio.

Se tiene el siguiente control de acceso por rol:
  - GET    /tareas/          = admin, supervisor, gerente, tecnico (todos los autenticados)
  - POST   /tareas/          = admin, supervisor  (solo pueden crear tareas con permisos)
  - PATCH  /tareas/{id}/estado    = admin, supervisor
  - PATCH  /tareas/{id}/reasignar = admin, supervisor
  - PATCH  /tareas/{id}/iniciar   = tecnico, admin, supervisor (el asignado inicia su tarea)

Requiere token JWT valido en Authorization: Bearer <token>.
"""

from datetime import date
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_current_empleado,
    require_roles,
    require_supervisor,
    require_tecnico,
)
from app.db.session import get_db
from app.models.empleado import Empleado, EmpleadoTarea
from app.models.tarea import Tarea
from app.schemas.tarea import (
    TareaCreate,
    TareaReasignar,
    TareaResponse,
    TareaUpdateEstado,
)

router = APIRouter(prefix="/tareas", tags=["Tareas"])


# GET /tareas/
# Tiene acceso cualquier empleado autenticado

@router.get(
    "/",
    response_model=List[TareaResponse],
    summary="Listar tareas",
    status_code=status.HTTP_200_OK,
)
async def get_tareas(
    db: Annotated[AsyncSession, Depends(get_db)],
    # Proteccion JWT: cualquier rol autenticado puede consultar tareas
    _current_user: Annotated[Empleado, Depends(get_current_empleado)],
    estado: Optional[str] = Query(None, description="Filtrar por estado de la tarea"),
    id_tecnico: Optional[int] = Query(None, description="Filtrar por técnico asignado"),
):
    """
    Retorna la lista de tareas con filtros opcionales.

    - Cualquier empleado autenticado puede listar tareas.
    - Se puede filtrar por estado (pendiente, en_progreso, completado, cancelado).
    - Se puede filtrar por técnico asignado.
    - Requiere token JWT válido.
    """
    query = select(Tarea)

    if estado:
        query = query.where(Tarea.estado_tarea == estado)

    result = await db.execute(query)
    tareas = result.scalars().all()

    # Filtro adicional por tecnico (a nivel de relacion)
    if id_tecnico:
        tareas = [
            t for t in tareas
            if any(et.id_empleado == id_tecnico for et in t.empleados)
        ]

    return tareas



# POST /tareas/
#Tiene unicamente  acceso admin y supervisor 

@router.post(
    "/",
    response_model=TareaResponse,
    summary="Crear nueva tarea",
    status_code=status.HTTP_201_CREATED,
)
async def create_tarea(
    tarea: TareaCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    # Solo admin y supervisor pueden crear tareas
    _current_user: Annotated[Empleado, Depends(require_supervisor)],
):
    """
    Crea una nueva tarea y opcionalmente la asigna a un técnico.

    - Solo roles admin y supervisor pueden crear tareas.
    - Si se provee id_tecnico, se crea la relación EmpleadoTarea.
    - Requiere token JWT válido con rol admin o supervisor.
    """
    nueva_tarea = Tarea(
        titulo=tarea.nombre,
        descripcion=tarea.descripcion,
        direccion_servicio=tarea.direccion,
        prioridad=tarea.prioridad,
        estado_tarea="pendiente",
    )

    db.add(nueva_tarea)
    await db.flush()  # Necesario para obtener id_tarea generado

    # Asignar tecnico si se provee en el body
    if tarea.id_tecnico:
        asignacion = EmpleadoTarea(
            id_empleado=tarea.id_tecnico,
            id_tarea=nueva_tarea.id_tarea,
        )
        db.add(asignacion)

    return nueva_tarea



# PATCH /tareas/{id}/estado
# Tiene acceso admin y supervisor

@router.patch(
    "/{id}/estado",
    response_model=TareaResponse,
    summary="Actualizar estado de una tarea",
    status_code=status.HTTP_200_OK,
)
async def update_estado(
    id: int,
    data: TareaUpdateEstado,
    db: Annotated[AsyncSession, Depends(get_db)],
    # Solo admin y supervisor pueden cambiar el estado directamente
    _current_user: Annotated[Empleado, Depends(require_supervisor)],
):
    """
    Cambia el estado de una tarea existente.

    - Solo roles admin y supervisor pueden actualizar el estado.
    - Estados válidos: pendiente, en_progreso, completado, cancelado.
    - Requiere token JWT válido con rol admin o supervisor.
    """
    result = await db.execute(select(Tarea).where(Tarea.id_tarea == id))
    tarea = result.scalar_one_or_none()

    if not tarea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tarea con id={id} no encontrada.",
        )

    tarea.estado_tarea = data.estado
    return tarea



# PATCH /tareas/{id}/reasignar
#Tiene acceso admin y supervisor

@router.patch(
    "/{id}/reasignar",
    response_model=TareaResponse,
    summary="Reasignar tarea a otro técnico",
    status_code=status.HTTP_200_OK,
)
async def reasignar_tarea(
    id: int,
    data: TareaReasignar,
    db: Annotated[AsyncSession, Depends(get_db)],
    # Solo admin y supervisor pueden reasignar tareas
    _current_user: Annotated[Empleado, Depends(require_supervisor)],
):
    """
    Reasigna una tarea a un técnico diferente.

    - Elimina todas las asignaciones previas de la tarea.
    - Crea una nueva asignación con el técnico indicado.
    - Solo roles admin y supervisor pueden reasignar.
    - Requiere token JWT válido con rol admin o supervisor.
    """
    result = await db.execute(select(Tarea).where(Tarea.id_tarea == id))
    tarea = result.scalar_one_or_none()

    if not tarea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tarea con id={id} no encontrada.",
        )

    # Eliminar asignaciones anteriores
    await db.execute(
        delete(EmpleadoTarea).where(EmpleadoTarea.id_tarea == id)
    )

    # Crear nueva asignación
    nueva_asignacion = EmpleadoTarea(
        id_empleado=data.id_tecnico,
        id_tarea=id,
    )
    db.add(nueva_asignacion)

    return tarea



# PATCH /tareas/{id}/iniciar
# Tiene acceso el tecnico asignado, admin y supervisor

@router.patch(
    "/{id}/iniciar",
    summary="Iniciar una tarea asignada",
    status_code=status.HTTP_200_OK,
)
async def iniciar_tarea(
    id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    # Tecnicos, admins y supervisores pueden iniciar tareas
    current_user: Annotated[Empleado, Depends(require_tecnico)],
):
    """
    Marca el inicio de una tarea por parte del técnico asignado.

    - Solo el técnico asignado a la tarea puede iniciarla (o admin/supervisor).
    - Verifica que el empleado autenticado esté asignado a la tarea.
    - Registra la fecha de inicio actual.
    - Requiere token JWT válido con rol tecnico, admin o supervisor.
    """
    # 1. Buscar la tarea
    result = await db.execute(select(Tarea).where(Tarea.id_tarea == id))
    tarea = result.scalar_one_or_none()

    if not tarea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tarea con id={id} no encontrada.",
        )

    # 2. Verificar que el tecnico autenticado este asignado a esta tarea
    #    (los admins y supervisores si pueden saltarse esta validación)
    if current_user.rol == "tecnico":
        result_asig = await db.execute(
            select(EmpleadoTarea).where(
                EmpleadoTarea.id_tarea == id,
                EmpleadoTarea.id_empleado == current_user.id_empleado,
            )
        )
        asignacion = result_asig.scalar_one_or_none()

        if not asignacion:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para iniciar esta tarea. "
                       "Solo el técnico asignado puede iniciarla.",
            )

    # 3. Verificar si tarea no ha sido iniciada ya
    if tarea.fecha_inicio is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La tarea ya fue iniciada anteriormente.",
        )

    # 4. Registrar fecha de inicio
    tarea.fecha_inicio = date.today()
    tarea.estado_tarea = "en_progreso"

    return {
        "message": "Tarea iniciada correctamente",
        "id_tarea": tarea.id_tarea,
        "titulo": tarea.titulo,
        "fecha_inicio": str(tarea.fecha_inicio),
        "estado": tarea.estado_tarea,
    }