from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


# 🔹 ENUMS (alineados a la lógica del sistema)
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


# 🔹 BASE (para creación)
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
class TareaResponse(BaseModel):
    id_tarea: int
    titulo: str
    descripcion: Optional[str] = None
    direccion_servicio: Optional[str] = None
    estado_tarea: str
    prioridad: str
    fecha_asignacion: Optional[datetime] = None

    class Config:
        from_attributes = True  # 🔥 Pydantic v2 (reemplaza orm_mode)


# 🔹 UPDATE ESTADO (PATCH /tareas/{id}/estado)
class TareaUpdateEstado(BaseModel):
    estado: EstadoServicio


# 🔹 REASIGNAR (PATCH /tareas/{id}/reasignar)
class TareaReasignar(BaseModel):
    id_tecnico: int