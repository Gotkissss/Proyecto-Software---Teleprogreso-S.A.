"""
Utilidades de seguridad: hashing de contraseñas y JWT.
"""
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# ── Hashing de contraseñas ─────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """Devuelve el hash bcrypt de una contraseña en texto plano."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Compara la contraseña en texto plano con el hash almacenado."""
    return pwd_context.verify(plain, hashed)


# ── JWT ''''''''''''────────────────────────────────────────────────────────────────────''''''''''''
# Conjunto en memoria para los tokens revocados (logout).
_revoked_tokens: set[str] = set()


def create_access_token(
    subject: int | str,
    rol: str,
    extra: dict[str, Any] | None = None,
) -> str:
    """
    Genera un JWT con los campos:
      - sub  : id del empleado (como str)
      - rol  : rol del empleado
      - exp  : fecha de expiración
      - iat  : fecha de emisión
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: dict[str, Any] = {
        "sub": str(subject),
        "rol": rol,
        "iat": now,
        "exp": expire,
    }
    if extra:
        payload.update(extra)

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decodifica y valida el JWT.
    Lanza JWTError si el token es invalido,esta  expirado o fue revocado.
    """
    if token in _revoked_tokens:
        raise JWTError("Token revocado")

    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def revoke_token(token: str) -> None:
    """Agrega el token al conjunto de tokens revocados (logout)."""
    _revoked_tokens.add(token)