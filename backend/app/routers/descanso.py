# backend/app/routers/descanso.py
"""
Router de Descanso — Teleprogreso S.A.
----------------
Gestiona el registro de inicio de descanso del empleado autenticado.

Todos los endpoints estan protegidos con JWT mediante la dependencia
get_current_empleado. El empleado solo puede registrar su propio descanso.

Endpoints que se tienen:
  POST /descanso/iniciar  = Registra el inicio de un descanso
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



#-------- POST /descanso/iniciar -----------------

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

    - El empleado debe tener una jornada activa (entrada sin salida registrada).
    - Si no hay jornada activa, retorna 400.
    - Requiere token JWT válido en el header Authorization: Bearer <token>.
    """
    # verificar que el empleado tenga una jornada activa
    result = await db.execute(
        select(Asistencia).where(
            Asistencia.id_empleado == current_user.id_empleado,
            Asistencia.hora_salida.is_(None),
        )
    )
    jornada_activa = result.scalar_one_or_none()

    # si no hay jornada activa mandamos error
    if not jornada_activa:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No tienes una jornada activa. "
                   "Registra tu entrada antes de iniciar un descanso.",
        )

    # aqui creamos el descanso y lo guardamos
    now = datetime.now()
    nuevo_descanso = Descanso(
        id_asistencia=jornada_activa.id_asistencia,
        hora_inicio=now.time(),
    )

    db.add(nuevo_descanso)
    await db.flush()  # para obtener el id_descanso generado

    # todo bien, retornamos el id
    return {
        "message": "Descanso iniciado correctamente",
        "id_descanso": nuevo_descanso.id_descanso,
        "empleado": f"{current_user.nombre} {current_user.apellido}",
        "hora_inicio": str(now.time().strftime("%H:%M:%S")),
    }
