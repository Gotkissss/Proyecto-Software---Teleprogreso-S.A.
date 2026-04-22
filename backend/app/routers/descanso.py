# backend/app/routers/descanso.py
"""
Router de Descanso — Teleprogreso S.A.
--------------
Gestiona el registro de inicio y fin de descanso del empleado autenticado.

Todos los endpoints estan protegidos con JWT mediante get_current_empleado.
El empleado solo puede registrar su propio descanso.

Endpoints:
  POST /descanso/iniciar   = Registra el inicio de un descanso
  POST /descanso/finalizar = Registra el fin del descanso activo
  GET  /descanso/activo    = Consulta si hay un descanso activo ahora mismo
"""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_empleado
from app.db.session import get_db
from app.models.asistencia import Asistencia, Descanso
from app.models.empleado import Empleado

router = APIRouter(prefix="/descanso", tags=["Descanso"])



# POST /descanso/iniciar
# Registra el inicio de un descanso para el empleado autenticado, siempre que tenga una jornada activa y no haya otro descanso en curso.


@router.post(
    "/iniciar",
    summary="Iniciar descanso",
    status_code=status.HTTP_201_CREATED,
)
async def iniciar_descanso(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_empleado)],
):
    """
    Registra el inicio de un descanso para el empleado autenticado.

    Reglas de negocio:
    - El empleado debe tener una jornada activa (entrada sin salida).
    - No puede iniciar un descanso si ya tiene uno activo (sin hora_fin).
    - Requiere token JWT válido en Authorization: Bearer <token>.

    Errores que se pueden dar:
    - 400 si no hay jornada activa.
    - 400 si ya hay un descanso en curso.
    - 401 si el token es invalido o expirado.
    - 403 si la cuenta está inactiva.
    """
    # 1. Verificar que el empleado tenga una jornada activa
    result_jornada = await db.execute(
        select(Asistencia).where(
            Asistencia.id_empleado == current_user.id_empleado,
            Asistencia.hora_salida.is_(None),
        )
    )
    jornada_activa = result_jornada.scalar_one_or_none()

    if not jornada_activa:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "No tienes una jornada activa. "
                "Registra tu entrada antes de iniciar un descanso."
            ),
        )

    # 2. Verificar que no haya ya un descanso en curso (sin hora_fin)
    result_descanso = await db.execute(
        select(Descanso).where(
            Descanso.id_asistencia == jornada_activa.id_asistencia,
            Descanso.hora_fin.is_(None),
        )
    )
    descanso_activo = result_descanso.scalar_one_or_none()

    if descanso_activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Ya tienes un descanso en curso. "
                "Finaliza el descanso actual antes de iniciar uno nuevo."
            ),
        )

    # 3. Crear el nuevo descanso
    now = datetime.now()
    nuevo_descanso = Descanso(
        id_asistencia=jornada_activa.id_asistencia,
        hora_inicio=now.time(),
    )

    db.add(nuevo_descanso)
    await db.flush()  # obtener id_descanso generado

    return {
        "message": "Descanso iniciado correctamente",
        "id_descanso": nuevo_descanso.id_descanso,
        "id_asistencia": jornada_activa.id_asistencia,
        "empleado": f"{current_user.nombre} {current_user.apellido}",
        "hora_inicio": now.time().strftime("%H:%M:%S"),
    }



# POST /descanso/finalizar 
# lo que hace es buscar el descanso activo del empleado autenticado y registrar la hora de fin

@router.post(
    "/finalizar",
    summary="Finalizar descanso activo",
    status_code=status.HTTP_200_OK,
)
async def finalizar_descanso(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_empleado)],
):
    """
    Registra el fin del descanso activo del empleado autenticado.

    Reglas de negocio:
    - El empleado debe tener una jornada activa.
    - Debe existir un descanso activo (sin hora_fin) en esa jornada.
    - Requiere token JWT válido en Authorization: Bearer <token>.

    Errores posibles:
    - 400 si no hay jornada activa.
    - 400 si no hay ningún descanso en curso.
    - 401 si el token es inválido o expirado.
    - 403 si la cuenta está inactiva.
    """
    # 1. Verificar jornada activa
    result_jornada = await db.execute(
        select(Asistencia).where(
            Asistencia.id_empleado == current_user.id_empleado,
            Asistencia.hora_salida.is_(None),
        )
    )
    jornada_activa = result_jornada.scalar_one_or_none()

    if not jornada_activa:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No tienes una jornada activa.",
        )

    # 2. Buscar el descanso activo (sin hora_fin)
    result_descanso = await db.execute(
        select(Descanso).where(
            Descanso.id_asistencia == jornada_activa.id_asistencia,
            Descanso.hora_fin.is_(None),
        )
    )
    descanso_activo = result_descanso.scalar_one_or_none()

    if not descanso_activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "No tienes ningún descanso en curso. "
                "Inicia un descanso antes de intentar finalizarlo."
            ),
        )

    # 3. Registrar la hora de fin
    now = datetime.now()
    descanso_activo.hora_fin = now.time()

    return {
        "message": "Descanso finalizado correctamente",
        "id_descanso": descanso_activo.id_descanso,
        "id_asistencia": jornada_activa.id_asistencia,
        "empleado": f"{current_user.nombre} {current_user.apellido}",
        "hora_inicio": descanso_activo.hora_inicio.strftime("%H:%M:%S"),
        "hora_fin": now.time().strftime("%H:%M:%S"),
    }



# GET /descanso/activo
# Consulta si el empleado autenticado tiene un descanso activo en este momento, buscando la jornada activa y luego un descanso sin hora_fin asociado a esa jornada.

@router.get(
    "/activo",
    summary="Consultar descanso activo",
    status_code=status.HTTP_200_OK,
)
async def get_descanso_activo(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_empleado)],
):
    """
    Consulta si el empleado autenticado tiene un descanso activo en este momento.

    util para que el frontend sincronice el estado del boton Pausar/Reanudar.

    Errores que se pueden dar:
    - 401 si el token es invalido o expirado.
    - 403 si la cuenta esta inactiva.
    """
    # Buscar jornada activa del empleado
    result_jornada = await db.execute(
        select(Asistencia).where(
            Asistencia.id_empleado == current_user.id_empleado,
            Asistencia.hora_salida.is_(None),
        )
    )
    jornada_activa = result_jornada.scalar_one_or_none()

    # Si no hay jornada, entonces obviamente no hay descanso activo
    if not jornada_activa:
        return {
            "en_descanso": False,
            "id_descanso": None,
            "hora_inicio": None,
        }

    # Buscar descanso activo en esa jornada
    result_descanso = await db.execute(
        select(Descanso).where(
            Descanso.id_asistencia == jornada_activa.id_asistencia,
            Descanso.hora_fin.is_(None),
        )
    )
    descanso_activo = result_descanso.scalar_one_or_none()

    if not descanso_activo:
        return {
            "en_descanso": False,
            "id_descanso": None,
            "hora_inicio": None,
        }

    return {
        "en_descanso": True,
        "id_descanso": descanso_activo.id_descanso,
        "hora_inicio": descanso_activo.hora_inicio.strftime("%H:%M:%S"),
    }