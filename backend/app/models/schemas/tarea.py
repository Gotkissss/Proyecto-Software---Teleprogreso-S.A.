from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


# 🔹 ENUMS (alineados a la BD)
class EstadoServicio(str, Enum):
    pendiente = "pendiente"
    en_progreso = "en_progreso"
    completado = "completado"
    cancelado = "cancelado"


class PrioridadServicio(str, Enum):
    baja = "baja"
    media = "media"
    alta = "alta"
    urgente = "urgente"


# 🔹 BASE (para reutilizar campos)
class TareaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    direccion: Optional[str] = None
    prioridad: Optional[PrioridadServicio] = PrioridadServicio.media
    id_tecnico: Optional[int] = None


# 🔹 CREATE (POST /tareas)
class TareaCreate(TareaBase):
    pass


# 🔹 RESPONSE (GET /tareas)
class TareaResponse(TareaBase):
    id_servicio: int
    estado: EstadoServicio
    fecha_asignacion: Optional[datetime] = None
    fecha_limite: Optional[datetime] = None
    fecha_inicio_real: Optional[datetime] = None
    fecha_fin_real: Optional[datetime] = None

    class Config:
        orm_mode = True


# 🔹 UPDATE ESTADO (PATCH /tareas/{id}/estado)
class TareaUpdateEstado(BaseModel):
    estado: EstadoServicio


# 🔹 REASIGNAR (PATCH /tareas/{id}/reasignar)
class TareaReasignar(BaseModel):
    id_tecnico: int