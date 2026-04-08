"""
Schemas Pydantic para el modulo de autenticación.
"""
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    correo: EmailStr
    contrasena: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: str
    id_empleado: int
    nombre: str


class TokenPayload(BaseModel):
    sub: str          # id_empleado como str
    rol: str