from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.db.session import get_db
from app.models.asistencia import Asistencia
from app.models.empleado import Empleado
from app.api.deps import get_current_empleado

router = APIRouter(prefix="/asistencia", tags=["Asistencia"])


@router.post("/entrada")
async def registrar_entrada(
    db: AsyncSession = Depends(get_db),
    current_user: Empleado = Depends(get_current_empleado),
):
    # 🔹 1. Verificar si ya tiene una entrada activa (sin salida)
    result = await db.execute(
        select(Asistencia).where(
            Asistencia.id_empleado == current_user.id_empleado,
            Asistencia.hora_salida == None  # 👈 importante
        )
    )
    asistencia_activa = result.scalar_one_or_none()

    if asistencia_activa:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una jornada activa"
        )

    # 🔹 2. Obtener fecha y hora actual
    now = datetime.now()

    # 🔹 3. Crear registro
    nueva_asistencia = Asistencia(
        id_empleado=current_user.id_empleado,
        fecha=now.date(),
        hora_entrada=now.time(),
        coordenada_entrada=None  # luego puedes meter GPS
    )

    db.add(nueva_asistencia)

    return {
        "message": "Entrada registrada correctamente",
        "id_asistencia": nueva_asistencia.id_asistencia
    }