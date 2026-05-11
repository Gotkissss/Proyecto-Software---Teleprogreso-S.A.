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
from app.core.exceptions import register_exception_handlers

# Importar todos los modelos para que SQLAlchemy los registre correctamente
import app.models  # noqa: F401

# ── Routers ──────────────────────────────────────────────────────────────────
from app.api.routers.auth   import router as auth_router
from app.routers.tareas     import router as tareas_router
from app.routers.asistencia import router as asistencia_router
from app.routers.descanso   import router as descanso_router
from app.routers.empleados  import router as empleados_router
from app.routers.metricas   import router as metricas_router   # Historia 6 — Gualim

app = FastAPI(
    title="Teleprogreso S.A. — API",
    description=(
        "API REST para supervision de personal, gestion de tareas "
        "y control de asistencia.\n\n"
        "Todos los endpoints (excepto POST /auth/login) requieren "
        "autenticación JWT mediante Bearer token.\n\n"
        "Los endpoints bajo /empleados requieren rol admin.\n\n"
    ),
    version="1.0.0",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Manejadores globales de error ─────────────────────────────────────────────
register_exception_handlers(app)

# ── Registro de routers ───────────────────────────────────────────────────────
app.include_router(auth_router)        # POST /auth/login | logout | GET /auth/me
app.include_router(tareas_router)      # GET/POST/PATCH /tareas/*
app.include_router(asistencia_router)  # POST /asistencia/entrada | salida | GET /hoy
app.include_router(descanso_router)    # POST /descanso/iniciar | finalizar | GET /activo
app.include_router(empleados_router)   # GET/POST/PATCH /empleados/*
app.include_router(metricas_router)    # GET /metricas/supervisor | /empleados/tecnicos/disponibles


# ── Health checks ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    """Endpoint raíz — confirma que la API está corriendo."""
    return {"message": "Teleprogreso API corriendo correctamente"}


@app.get("/health", tags=["Health"])
async def health():
    """Health check para Docker y load balancers."""
    return {"status": "ok"}