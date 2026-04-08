from fastapi import FastAPI
from app.routers import tareas
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base

# Importar todos los modelos para que SQLAlchemy los pueda registrar
import app.models  # noqa: F401

# --------- Routers---------------
from app.api.routers.auth import router as auth_router

app = FastAPI(
    title="Teleprogreso S.A.",
    description="API para supervision de personal y gestion de activos",
    version="1.0.0",
)

app.include_router(tareas.router)

# CORS — permite que el frontend React se comunique con el backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----- Registrar routers --------------------------------
app.include_router(auth_router)


@app.get("/")
async def root():
    return {"message": "Teleprogreso API corriendo correctamente"}


@app.get("/health")
async def health():
    return {"status": "ok"}

