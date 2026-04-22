# backend/tests/test_auth_protection.py
"""
Pruebas de endpoints protegidos — Teleprogreso S.A.
-------
Verifica:
Sin token = 401
Token invalido = 401
Token expirado = 401
Control de roles = 403
Token valido = acceso permitido
"""

import pytest  #no se usa directamente, pero es necesario para que pytest reconozca los fixtures definidos en conftest.py
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock

from app.main import app
from app.core.security import create_access_token

client = TestClient(app, raise_server_exceptions=False)



# Helpers para generar tokens y mockear empleados


def make_token(rol="tecnico"):
    return create_access_token(subject=1, rol=rol)


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def mock_empleado(rol="tecnico", estado="activo"):
    emp = MagicMock()
    emp.id_empleado = 1
    emp.nombre = "Test"
    emp.apellido = "User"
    emp.rol = rol
    emp.estado = estado
    return emp



# 1. SIN TOKEN = 401
# Verifica que los endpoints protegidos no permitan acceso sin un token JWT válido en el header Authorization.


def test_sin_token_asistencia():
    res = client.post("/asistencia/entrada")
    assert res.status_code == 401


def test_sin_token_tareas():
    res = client.get("/tareas/")
    assert res.status_code == 401



# 2. TOKEN INVALIDO = 401
# Verifica que un token mal formado o con firma inválida sea rechazado con 401 Unauthorized. Esto simula intentos de acceso con tokens falsificados o manipulados.

def test_token_invalido():
    res = client.get(
        "/tareas/",
        headers={"Authorization": "Bearer token_invalido"},
    )
    assert res.status_code == 401


# 3. TOKEN EXPIRADO = 401
# Verifica que un token JWT que ha expirado sea rechazado con 401 Unauthorized. Esto simula intentos de acceso con tokens antiguos o comprometidos.


def test_token_expirado():
    with patch("app.core.security.settings") as mock_settings:
        mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = -1
        mock_settings.SECRET_KEY = "test"
        mock_settings.ALGORITHM = "HS256"

        from app.core.security import create_access_token as _make
        expired_token = _make(subject=1, rol="tecnico")

    res = client.get("/auth/me", headers=auth(expired_token))
    assert res.status_code == 401



# 4. CONTROL DE ROL = 403
# Verifica que un usuario autenticado pero con un rol que no tiene permisos para un endpoint específico reciba un 403 Forbidden. Esto simula intentos de acceso a recursos restringidos por parte de usuarios con roles inadecuados.


def test_tecnico_no_puede_crear_tarea():
    token = make_token("tecnico")
    empleado = mock_empleado("tecnico")

    with patch("app.api.deps.get_db") as mock_db, \
         patch("app.api.deps.decode_access_token") as mock_decode:

        mock_decode.return_value = {"sub": "1", "rol": "tecnico"}

        db = AsyncMock()
        result = MagicMock()
        result.scalar_one_or_none.return_value = empleado
        db.execute = AsyncMock(return_value=result)

        mock_db.return_value.__aenter__ = AsyncMock(return_value=db)
        mock_db.return_value.__aexit__ = AsyncMock(return_value=False)

        res = client.post(
            "/tareas/",
            headers=auth(token),
            json={"nombre": "Test", "prioridad": "media"},
        )

    assert res.status_code == 403



# 5. TOKEN VALIDO = 200
# Verifica que un usuario autenticado con un token JWT valido y con el rol adecuado pueda acceder a los endpoints protegidos sin problemas.
# Esto confirma que la autenticacion y autorizacion funcionan correctamente.


def test_token_valido_acceso():
    token = make_token("tecnico")
    empleado = mock_empleado("tecnico")

    with patch("app.api.deps.get_db") as mock_db, \
         patch("app.api.deps.decode_access_token") as mock_decode:

        mock_decode.return_value = {"sub": "1", "rol": "tecnico"}

        db = AsyncMock()
        result = MagicMock()
        result.scalar_one_or_none.return_value = empleado
        db.execute = AsyncMock(return_value=result)

        mock_db.return_value.__aenter__ = AsyncMock(return_value=db)
        mock_db.return_value.__aexit__ = AsyncMock(return_value=False)

        res = client.get("/auth/me", headers=auth(token))

    assert res.status_code == 200



# 6. CUENTA INACTIVA = 403
# Verifica que un usuario autenticado pero con estado de cuenta inactivo reciba un 403 Forbidden al intentar acceder a endpoints protegidos. 
# Esto simula intentos de acceso por parte de empleados que han sido desactivados o suspendidos.


def test_cuenta_inactiva():
    token = make_token("tecnico")
    empleado = mock_empleado("tecnico", estado="inactivo")

    with patch("app.api.deps.get_db") as mock_db, \
         patch("app.api.deps.decode_access_token") as mock_decode:

        mock_decode.return_value = {"sub": "1", "rol": "tecnico"}

        db = AsyncMock()
        result = MagicMock()
        result.scalar_one_or_none.return_value = empleado
        db.execute = AsyncMock(return_value=result)

        mock_db.return_value.__aenter__ = AsyncMock(return_value=db)
        mock_db.return_value.__aexit__ = AsyncMock(return_value=False)

        res = client.get("/auth/me", headers=auth(token))

    assert res.status_code == 403