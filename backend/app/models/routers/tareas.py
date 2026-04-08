from fastapi import APIRouter, Query
from typing import List, Optional
from app.schemas.tarea import TareaResponse, EstadoServicio
from app.schemas.tarea import TareaCreate
from datetime import datetime
from fastapi import HTTPException
from app.schemas.tarea import TareaUpdateEstado

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

@router.post("/", response_model=TareaResponse)
def create_tarea(tarea: TareaCreate):
    # 🔹 Generar ID automático (simulado)
    new_id = len(tareas_mock) + 1

    nueva_tarea = {
        "id_servicio": new_id,
        "nombre": tarea.nombre,
        "descripcion": tarea.descripcion,
        "direccion": tarea.direccion,
        "estado": "pendiente",  # siempre inicia así
        "prioridad": tarea.prioridad,
        "id_tecnico": tarea.id_tecnico,
        "fecha_asignacion": datetime.now(),
        "fecha_limite": None,
        "fecha_inicio_real": None,
        "fecha_fin_real": None
    }

    # 🔹 Guardar en mock
    tareas_mock.append(nueva_tarea)

    return nueva_tarea


@router.patch("/{id}/estado", response_model=TareaResponse)
def update_estado(id: int, data: TareaUpdateEstado):
    
    # 🔹 Buscar tarea
    for tarea in tareas_mock:
        if tarea["id_servicio"] == id:
            
            # 🔹 Actualizar estado
            tarea["estado"] = data.estado
            
            return tarea

    # 🔹 Si no existe
    raise HTTPException(status_code=404, detail="Tarea no encontrada")  