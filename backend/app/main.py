# backend/app/main.py
"""
Punto de entrada de la aplicación FastAPI — Teleprogreso S.A.
-------
este archivo configura:
  - CORS para el frontend React
  - Manejadores globales de errores de autenticación 
  - Registro de todos los routers de la API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import register_exception_handlers  #  manejo de errores

# Importar todos los modelos para que SQLAlchemy los registre correctamente
import app.models  # no se usa directamente, pero es necesario para que SQLAlchemy conozca los modelos y pueda crear las tablas en la base de datos.

#--- Routers -----
from app.api.routers.auth      import router as auth_router
from app.routers.tareas        import router as tareas_router
from app.routers.asistencia    import router as asistencia_router
from app.routers.descanso      import router as descanso_router
from app.routers.empleados     import router as empleados_router  

app = FastAPI(
    title="Teleprogreso S.A. — API",
    description=(
        "API REST para supervision de personal, gestion de tareas "
        "y control de asistencia.\n\n"
        "Todos los endpoints (excepto POST /auth/login) requieren "
        "autenticación JWT mediante Bearer token.\n\n"
        "Los endpoints bajo /empleados requieren rol admin."
    ),
    version="1.0.0",
    # Deshabilitar la redireccion automatica de /docs para produccion si se desea
    # docs_url=None, redoc_url=None,
)

#  CORS
# Permite que el frontend React (puerto 3000 / 5173) se comunique con el backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Manejadores globales de error 
# Centraliza respuestas para: token expirado, token invalido,
# sin permisos, errores de validacion y errores internos.
register_exception_handlers(app)

# ----- Routers -----
app.include_router(auth_router)          # POST /auth/login, POST /auth/logout, GET /auth/me
app.include_router(tareas_router)        # GET/POST/PATCH /tareas/*  (protegido por rol)
app.include_router(asistencia_router)    # POST /asistencia/entrada, /salida, GET /hoy
app.include_router(descanso_router)      # POST /descanso/iniciar, /finalizar, GET /activo
app.include_router(empleados_router)   # GET/POST/PATCH /empleados/*  (protegido por rol admin)

#  Endpoints de salud se mantienen

@app.get("/", tags=["Health"])
async def root():
    """Endpoint raíz — confirma que la API está corriendo."""
    return {"message": "Teleprogreso API corriendo correctamente"}


@app.get("/health", tags=["Health"])
async def health():
    """Health check para Docker y load balancers."""
    return {"status": "ok"}