# backend/app/schemas/empleado.py
"""
Schemas Pydantic para el modulo de gestion de empleados.
Define los modelos de entrada (request) y salida (response)
para los endpoints de la API de empleados.

Esquema de validacion de roles :
Roles validos: admin | supervisor | tecnico | gerente
Estados validos: activo | inactivo

Usado por los routers:
  GET  /empleados              = EmpleadoResponse (lista)
  POST /empleados              = EmpleadoCreate = EmpleadoResponse
  PATCH /empleados/{id}        = EmpleadoUpdate = EmpleadoResponse
  PATCH /empleados/{id}/estado = EmpleadoEstadoUpdate = EmpleadoResponse
"""

from datetime import date, datetime
from typing import Optional
from enum import Enum

from pydantic import BaseModel, EmailStr, field_validator, model_validator


# ── Enums de dominio ───────────────────────────────────────────────────────

class RolEmpleado(str, Enum):
    """
    Roles permitidos en el sistema.
    Estos valores deben coincidir con los guardados en la columna
    'rol' de la tabla 'empleado'.
    """
    admin      = "admin"
    supervisor = "supervisor"
    tecnico    = "tecnico"
    gerente    = "gerente"


class EstadoEmpleado(str, Enum):
    """
    Estado de la cuenta del empleado.
    'inactivo' significa desactivado (no eliminado de la BD).
    """
    activo   = "activo"
    inactivo = "inactivo"


# ------ Schemas de Peticion (entrada) -----

class EmpleadoCreate(BaseModel):
    """
    Datos requeridos para crear un nuevo empleado.
    Usado por POST /empleados (solo admin puede llamar este endpoint).

    Validaciones  implementadas aqui (lado backend):
      - correo: formato email valido (pydantic EmailStr)
      - rol: debe ser uno de los 4 roles permitidos
      - contrasena: minimo 8 caracteres
      - fecha_contratacion: no puede ser fecha futura
    """
    nombre:             str
    apellido:           str
    correo:             EmailStr
    contrasena:         str
    rol:                RolEmpleado
    fecha_contratacion: date
    telefono:           Optional[str] = None

    @field_validator("contrasena") # Valida que la contraseña tenga al menos 8 caracteres.
    @classmethod 
    def contrasena_minima(cls, v: str) -> str:
        """La contraseña debe tener al menos 8 caracteres."""
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres.")
        return v

    @field_validator("fecha_contratacion") # Valida que la fecha de contratación no sea una fecha futura.
    @classmethod
    def fecha_no_futura(cls, v: date) -> date:
        """La fecha de contratación no puede ser una fecha futura."""
        if v > date.today():
            raise ValueError(
                "La fecha de contratación no puede ser una fecha futura."
            )
        return v

    @field_validator("nombre", "apellido") # Valida que el nombre y apellido no sean cadenas vacias o solo espacios.
    @classmethod
    def nombre_no_vacio(cls, v: str) -> str:
        """Nombre y apellido no pueden ser cadenas vacías o solo espacios."""
        v = v.strip()
        if not v:
            raise ValueError("Este campo no puede estar vacio.")
        return v

    class Config:
        # Permite pasar el enum como string directamente en JSON
        use_enum_values = True


class EmpleadoUpdate(BaseModel):
    """
    Campos editables de un empleado existente.
    Todos los campos son opcionales: solo se actualizan los que se envien.

    campos editables definidos:
      - nombre, apellido, telefono  = datos personales
      - correo                      = con validacion de unicidad en el router
      - rol                         = solo admin puede cambiar roles

    Campos NO editables via PATCH /empleados/{id}:
      - estado           = se cambia via PATCH /empleados/{id}/estado
      - fecha_registro   = inmutable (generada por BD)
    """
    nombre:             Optional[str]       = None
    apellido:           Optional[str]       = None
    correo:             Optional[EmailStr]  = None
    rol:                Optional[RolEmpleado] = None
    telefono:           Optional[str]       = None
    fecha_contratacion: Optional[date]      = None

    @field_validator("nombre", "apellido")
    @classmethod
    def nombre_no_vacio(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Este campo no puede estar vacio.")
        return v

    @field_validator("fecha_contratacion")
    @classmethod
    def fecha_no_futura(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v > date.today():
            raise ValueError(
                "La fecha de contratacion no puede ser una fecha futura."
            )
        return v

    @model_validator(mode="after")
    def al_menos_un_campo(self) -> "EmpleadoUpdate":
        """Al menos un campo debe estar presente en la peticion PATCH."""
        campos = [
            self.nombre, self.apellido, self.correo,
            self.rol, self.telefono, self.fecha_contratacion,
        ]
        if all(c is None for c in campos):
            raise ValueError(
                "Debes enviar al menos un campo para actualizar."
            )
        return self

    class Config:
        use_enum_values = True


class EmpleadoEstadoUpdate(BaseModel):
    """
    Payload para activar o desactivar la cuenta de un empleado.

    Importante mencionar que  'desactivar' significa cambiar estado a 'inactivo'.
    El registro NO se elimina de la base de datos; solo se bloquea el acceso.
    Un empleado con estado 'inactivo' recibe 403 al intentar autenticarse
    """
    estado: EstadoEmpleado

    class Config:
        use_enum_values = True


# ------- Schemas de Respuesta (salida) -------

class EmpleadoResponse(BaseModel):
    """
    Representacion publica de un empleado.

    En donde nunca se expone hash_contrasena en las respuestas.
    """
    id_empleado:        int
    nombre:             str
    apellido:           str
    correo:             str
    rol:                str
    estado:             str
    telefono:           Optional[str]
    fecha_contratacion: date
    fecha_registro:     datetime
    ultimo_acceso:      Optional[datetime]

    class Config:
        from_attributes = True  # Permite crear este modelo a partir de un objeto ORM (como el modelo SQLAlchemy Empleado).


class EmpleadoListResponse(BaseModel):
    """
    Respuesta paginada/filtrada de la lista de empleados.
    Incluye metadatos utiles para el frontend.
    """
    total:     int
    empleados: list[EmpleadoResponse]
