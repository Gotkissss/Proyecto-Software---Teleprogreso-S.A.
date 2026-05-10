from pydantic import BaseModel
from typing import Optional
from datetime import date
from enum import Enum


# 🔹 ENUMS
class EstadoServicio(str, Enum):
    pendiente   = "pendiente"
    en_progreso = "en_progreso"
    completado  = "completado"
    cancelado   = "cancelado"


class PrioridadServicio(str, Enum):
    baja    = "baja"
    media   = "media"
    alta    = "alta"
    urgente = "urgente"


# 🔹 TecnicoResponse va ANTES de TareaResponse porque lo usa
class TecnicoResponse(BaseModel):
    id_empleado: int
    nombre:      str

    class Config:
        from_attributes = True


# 🔹 BASE
class TareaBase(BaseModel):
    nombre:     str
    descripcion: Optional[str]            = None
    direccion:   Optional[str]            = None
    prioridad:   Optional[PrioridadServicio] = PrioridadServicio.media
    id_tecnico:  Optional[int]            = None


# 🔹 CREATE
class TareaCreate(TareaBase):
    pass


# 🔹 RESPONSE — ahora TecnicoResponse ya está definido arriba
class TareaResponse(BaseModel):
    id_tarea:           int
    titulo:             str
    descripcion:        Optional[str]             = None
    direccion_servicio: Optional[str]             = None
    estado_tarea:       str
    prioridad:          str
    fecha_asignacion:   Optional[date]            = None
    tecnico:            Optional[TecnicoResponse] = None

    class Config:
        from_attributes = True


# 🔹 UPDATE ESTADO
class TareaUpdateEstado(BaseModel):
    estado: EstadoServicio


# 🔹 REASIGNAR
class TareaReasignar(BaseModel):
    id_tecnico: int