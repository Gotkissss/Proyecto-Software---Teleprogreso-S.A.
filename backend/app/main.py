from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine
from app.db.base import Base

# Importar todos los modelos para que SQLAlchemy los registre
import app.models  # noqa: F401

app = FastAPI(
    title="Teleprogreso S.A.",
    description="API para supervisión de personal y gestión de activos",
    version="1.0.0",
)

# CORS — permite que el frontend React se comunique con el backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Teleprogreso API corriendo correctamente"}


@app.get("/health")
async def health():
    return {"status": "ok"}