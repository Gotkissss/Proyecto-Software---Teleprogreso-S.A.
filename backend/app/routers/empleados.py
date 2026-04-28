# backend/app/routers/empleados.py
"""
Router de Empleados Teleprogreso S.A.
----------------------------------------
Gestiona la consulta y modifica  empleados del sistema.

Control de acceso: Todos los endpoints estan protegidos con require_admin.
 Solo usuarios con rol 'admin' pueden acceder.

Endpoints implementados:

  GET  /empleados                   = Lista empleados con filtros opcionales 
  PATCH /empleados/{id}             = Editar datos de un empleado
  PATCH /empleados/{id}/estado      = Activar o desactivar un empleado 

Endpoint POST /empleados:
  Va estar Implementado por Biancka.

Importate:
  - 'Desactivar' cambia el campo de `estado` a 'inactivo', en si no elimina el registro.
  - Un empleado inactivo recibe 403 al intentar autenticarse ( deps.py).
  - El admin no puede desactivarse a si mismo (guard en PATCH /{id}/estado).
"""

from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_empleado, require_admin
from app.core.security import hash_password
from app.db.session import get_db
from app.models.empleado import Empleado
from app.schemas.empleado import (
    EmpleadoCreate,
    EmpleadoEstadoUpdate,
    EmpleadoListResponse,
    EmpleadoResponse,
    EmpleadoUpdate,
)

router = APIRouter(prefix="/empleados", tags=["Empleados"])


#---------- GET /empleados -----------------
#Como administrador, quiero ver la lista completa de empleados.

@router.get(
    "/", # El path es solo "/" porque el prefijo del router ya es "/empleados"
    response_model=EmpleadoListResponse,
    summary="Listar todos los empleados",
    status_code=status.HTTP_200_OK,
)
async def get_empleados( # Endpoint para listar empleados con filtros opcionales.
    db: Annotated[AsyncSession, Depends(get_db)],
    # Solo el admin puede ver la lista completa de empleados
    _current_user: Annotated[Empleado, Depends(require_admin)],
    # Filtros opcionales
    rol: Optional[str] = Query(
        None,
        description="Filtrar por rol: admin | supervisor | tecnico | gerente",
    ),
    estado: Optional[str] = Query(
        None,
        description="Filtrar por estado: activo | inactivo",
    ),
    buscar: Optional[str] = Query(
        None,
        description="Buscar por nombre, apellido o correo (búsqueda parcial)",
    ),
):
   
    # Construir la query base
    query = select(Empleado)

    # Aplicar filtro por rol si se proporciono
    if rol:
        # Validar que el rol sea uno de los permitidos
        roles_validos = {"admin", "supervisor", "tecnico", "gerente"}
        if rol not in roles_validos:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Rol '{rol}' no es válido. "
                    f"Roles permitidos: {', '.join(sorted(roles_validos))}"
                ),
            )
        query = query.where(Empleado.rol == rol)

    # Aplicar filtro por estado si se proporciono
    if estado:
        estados_validos = {"activo", "inactivo"}
        if estado not in estados_validos:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Estado '{estado}' no es válido. "
                    f"Estados permitidos: {', '.join(sorted(estados_validos))}"
                ),
            )
        query = query.where(Empleado.estado == estado)

    # Aplicar busqueda de texto libre (case-insensitive) si se proporciono
    if buscar:
        termino = f"%{buscar.strip().lower()}%"
        from sqlalchemy import func, or_
        query = query.where(
            or_(
                func.lower(Empleado.nombre).like(termino),
                func.lower(Empleado.apellido).like(termino),
                func.lower(Empleado.correo).like(termino),
            )
        )

    # Ordenar por nombre para presentacion consistente
    query = query.order_by(Empleado.nombre, Empleado.apellido)

    result = await db.execute(query)
    empleados = result.scalars().all()

    return EmpleadoListResponse(
        total=len(empleados),
        empleados=empleados,
    )


# ----------------- POST /empleados ---------------
# implementado por Biancka.
# Se incluye aquí el stub del endpoint para que quede en el mismo router

@router.post(
    "/",
    response_model=EmpleadoResponse,
    summary="Crear nuevo empleado",
    status_code=status.HTTP_201_CREATED,
)
async def create_empleado(
    empleado_data: EmpleadoCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _current_user: Annotated[Empleado, Depends(require_admin)],
):

    #  Verificar que el correo no este registrado ya
    result = await db.execute(
        select(Empleado).where(Empleado.correo == empleado_data.correo)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Ya existe un empleado registrado con el correo "
                f"'{empleado_data.correo}'."
            ),
        )

    # Crear el nuevo empleado con contraseña hasheada
    nuevo_empleado = Empleado(
        nombre=empleado_data.nombre,
        apellido=empleado_data.apellido,
        correo=empleado_data.correo,
        hash_contrasena=hash_password(empleado_data.contrasena),
        rol=empleado_data.rol,
        estado="activo",
        telefono=empleado_data.telefono,
        fecha_contratacion=empleado_data.fecha_contratacion,
    )

    db.add(nuevo_empleado)
    await db.flush()  # Obtener el id_empleado generado

    return nuevo_empleado


# -------   PATCH /empleados/{id}---=-----
#Como administrador, quiero editar datos de un empleado.

@router.patch(
    "/{id}",
    response_model=EmpleadoResponse,
    summary="Editar datos de un empleado",
    status_code=status.HTTP_200_OK,
)
async def update_empleado(
    id: int,
    data: EmpleadoUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _current_user: Annotated[Empleado, Depends(require_admin)],
):
    #Buscar el empleado que se quiere editar
    result = await db.execute(
        select(Empleado).where(Empleado.id_empleado == id)
    )
    empleado = result.scalar_one_or_none()

    if not empleado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró ningún empleado con id={id}.",
        )

    # Si se esta cambiando el correo, verificar que no este en uso
    if data.correo and data.correo != empleado.correo:
        result_correo = await db.execute(
            select(Empleado).where(Empleado.correo == data.correo)
        )
        if result_correo.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"El correo '{data.correo}' ya está en uso "
                    f"por otro empleado."
                ),
            )

    # Aplicar solo los campos que se enviaron (PATCH parcial)
    #    Se usa exclude_unset=True para no sobreescribir con None
    campos_actualizados = data.model_dump(exclude_unset=True)

    for campo, valor in campos_actualizados.items():
        setattr(empleado, campo, valor)

    #La sesion hace commit automatico al salir del contexto ( session.py)
    return empleado


# -------- PATCH /empleados/{id}/estado ---------
#Como administrador, quiero activar o desactivar cuentas.

@router.patch(
    "/{id}/estado",
    response_model=EmpleadoResponse,
    summary="Activar o desactivar la cuenta de un empleado",
    status_code=status.HTTP_200_OK,
)
async def update_estado_empleado(
    id: int,
    data: EmpleadoEstadoUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(require_admin)],
):
    #Cambia el estado de la cuenta de un empleado a activo o inactivo.
    #Guard: el admin no puede desactivarse a si mismo
    if id == current_user.id_empleado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "No puedes cambiar el estado de tu propia cuenta. "
                "Pide a otro administrador que realice este cambio."
            ),
        )

    #Buscar el empleado objetivo
    result = await db.execute(
        select(Empleado).where(Empleado.id_empleado == id)
    )
    empleado = result.scalar_one_or_none()

    if not empleado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró ningún empleado con id={id}.",
        )

    # Verificar si el cambio es necesario para evitar escrituras innecesarias
    if empleado.estado == data.estado:
        accion = "activo" if data.estado == "activo" else "inactivo"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"El empleado '{empleado.nombre} {empleado.apellido}' "
                f"ya tiene el estado '{accion}'."
            ),
        )

    # Aplicar el cambio de estado
    empleado.estado = data.estado

    return empleado