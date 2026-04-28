"""
Schemas Pydantic para el modulo de Empleado.

SCRUM-62: Esquema de validacion de roles permitidos
(admin, supervisor, tecnico, gerente) y campos obligatorios del empleado.
"""
from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ──────────────────────────────────────────────────────────────────────────
# 🔹 ENUMS — Roles y estados permitidos en el sistema
# ──────────────────────────────────────────────────────────────────────────
class RolEmpleado(str, Enum):
    """Roles permitidos para un empleado dentro del sistema."""
    admin = "admin"
    supervisor = "supervisor"
    tecnico = "tecnico"
    gerente = "gerente"


class EstadoEmpleado(str, Enum):
    """Estados permitidos para una cuenta de empleado."""
    activo = "activo"
    inactivo = "inactivo"
    suspendido = "suspendido"


# ──────────────────────────────────────────────────────────────────────────
# 🔹 BASE — Campos comunes a todas las operaciones
# ──────────────────────────────────────────────────────────────────────────
class EmpleadoBase(BaseModel):
    """
    Campos base de un empleado.

    Campos obligatorios:
      - nombre, apellido, correo, rol, fecha_contratacion
    Campos opcionales:
      - telefono, estado
    """
    nombre: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Nombre del empleado (obligatorio).",
    )
    apellido: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Apellido del empleado (obligatorio).",
    )
    correo: EmailStr = Field(
        ...,
        max_length=100,
        description="Correo electronico unico del empleado (obligatorio).",
    )
    rol: RolEmpleado = Field(
        ...,
        description="Rol del empleado: admin | supervisor | tecnico | gerente.",
    )
    fecha_contratacion: date = Field(
        ...,
        description="Fecha en la que el empleado fue contratado (obligatorio).",
    )
    telefono: Optional[str] = Field(
        None,
        max_length=20,
        description="Numero de telefono del empleado (opcional).",
    )
    estado: EstadoEmpleado = Field(
        default=EstadoEmpleado.activo,
        description="Estado de la cuenta. Por defecto 'activo'.",
    )

    # ── Validaciones de negocio ──────────────────────────────────────────
    @field_validator("nombre", "apellido")
    @classmethod
    def _no_solo_espacios(cls, v: str) -> str:
        """El nombre y el apellido no pueden ser solo espacios en blanco."""
        if not v.strip():
            raise ValueError("No puede estar vacio o contener solo espacios.")
        return v.strip()

    @field_validator("fecha_contratacion")
    @classmethod
    def _fecha_no_futura(cls, v: date) -> date:
        """La fecha de contratacion no puede ser en el futuro."""
        if v > date.today():
            raise ValueError("La fecha de contratacion no puede ser en el futuro.")
        return v

    @field_validator("telefono")
    @classmethod
    def _telefono_formato(cls, v: Optional[str]) -> Optional[str]:
        """Si se proporciona telefono, debe contener solo digitos, espacios, '+' o '-'."""
        if v is None or v.strip() == "":
            return None
        cleaned = v.strip()
        permitidos = set("0123456789+-() ")
        if not all(c in permitidos for c in cleaned):
            raise ValueError(
                "El telefono solo puede contener digitos, espacios, '+', '-', '(' y ')'."
            )
        # Al menos 7 digitos reales
        digitos = sum(1 for c in cleaned if c.isdigit())
        if digitos < 7:
            raise ValueError("El telefono debe tener al menos 7 digitos.")
        return cleaned


# ──────────────────────────────────────────────────────────────────────────
# 🔹 CREATE — Para POST /empleados (creacion por admin)
# ──────────────────────────────────────────────────────────────────────────
class EmpleadoCreate(EmpleadoBase):
    """
    Schema para crear un nuevo empleado.

    Incluye 'contrasena' en texto plano (se hashea en el endpoint antes de guardar).
    """
    contrasena: str = Field(
        ...,
        min_length=8,
        max_length=72,  # limite de bcrypt
        description="Contrasena en texto plano. Minimo 8 caracteres.",
    )

    @field_validator("contrasena")
    @classmethod
    def _contrasena_segura(cls, v: str) -> str:
        """
        La contrasena debe contener al menos:
          - una letra mayuscula
          - una letra minuscula
          - un digito
        """
        if not any(c.isupper() for c in v):
            raise ValueError("La contrasena debe tener al menos una letra mayuscula.")
        if not any(c.islower() for c in v):
            raise ValueError("La contrasena debe tener al menos una letra minuscula.")
        if not any(c.isdigit() for c in v):
            raise ValueError("La contrasena debe tener al menos un digito.")
        return v


# ──────────────────────────────────────────────────────────────────────────
# 🔹 UPDATE — Para PATCH /empleados/{id} (todos los campos opcionales)
# ──────────────────────────────────────────────────────────────────────────
class EmpleadoUpdate(BaseModel):
    """Schema para actualizacion parcial de un empleado."""
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    apellido: Optional[str] = Field(None, min_length=2, max_length=100)
    correo: Optional[EmailStr] = Field(None, max_length=100)
    rol: Optional[RolEmpleado] = None
    telefono: Optional[str] = Field(None, max_length=20)
    estado: Optional[EstadoEmpleado] = None


# ──────────────────────────────────────────────────────────────────────────
# 🔹 RESPONSE — Lo que se devuelve al cliente (NUNCA incluir hash_contrasena)
# ──────────────────────────────────────────────────────────────────────────
class EmpleadoResponse(BaseModel):
    """Schema de respuesta para GET /empleados y similares."""
    id_empleado: int
    nombre: str
    apellido: str
    correo: EmailStr
    rol: RolEmpleado
    estado: EstadoEmpleado
    telefono: Optional[str] = None
    fecha_contratacion: date
    fecha_registro: datetime
    ultimo_acceso: Optional[datetime] = None

    class Config:
        from_attributes = True  # Pydantic v2 (reemplaza orm_mode)