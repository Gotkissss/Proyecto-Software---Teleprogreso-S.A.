from fastapi import APIRouter, Query
from typing import List, Optional
from app.schemas.tarea import TareaResponse, EstadoServicio

router = APIRouter(prefix="/tareas", tags=["Tareas"])


# 🔹 Mock data (temporal)
tareas_mock = [
    {
        "id_servicio": 1,
        "nombre": "Instalación de internet",
        "descripcion": "Instalar fibra óptica",
        "direccion": "Zona 10",
        "estado": "pendiente",
        "prioridad": "alta",
        "id_tecnico": 1,
        "fecha_asignacion": None,
        "fecha_limite": None,
        "fecha_inicio_real": None,
        "fecha_fin_real": None
    },
    {
        "id_servicio": 2,
        "nombre": "Reparación",
        "descripcion": "Falla en router",
        "direccion": "Zona 1",
        "estado": "en_progreso",
        "prioridad": "media",
        "id_tecnico": 2,
        "fecha_asignacion": None,
        "fecha_limite": None,
        "fecha_inicio_real": None,
        "fecha_fin_real": None
    }
]


# 🔹 GET /tareas
@router.get("/", response_model=List[TareaResponse])
def get_tareas(
    estado: Optional[EstadoServicio] = Query(None),
    id_tecnico: Optional[int] = Query(None)
):
    tareas = tareas_mock

    # 🔸 filtro por estado
    if estado:
        tareas = [t for t in tareas if t["estado"] == estado]

    # 🔸 filtro por técnico
    if id_tecnico:
        tareas = [t for t in tareas if t["id_tecnico"] == id_tecnico]

    return tareas