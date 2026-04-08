from fastapi import FastAPI
from app.routers import tareas

app = FastAPI()

app.include_router(tareas.router)