# Backend — FastAPI ────────────────────────────────────────
FROM python:3.11-slim

# Variables de entorno para Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema necesarias para psycopg2 / asyncpg
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY . .

EXPOSE 8000

# En local (docker-compose) el command se sobrescribe.
# En Railway / cualquier despliegue plano: aplicamos migraciones + seed
# y luego arrancamos uvicorn. El seed.py solo inserta datos si la BD
# está vacía, así que es seguro ejecutarlo en cada arranque.
# Railway inyecta $PORT en runtime; si no existe usamos 8000 por defecto.
# --proxy-headers + --forwarded-allow-ips=* hacen que uvicorn confíe
# en los X-Forwarded-Proto/For que envía el proxy de Railway. Sin esto,
# cualquier redirect 307 (p.e. /tareas → /tareas/) se genera con esquema
# http:// y el navegador lo bloquea por Mixed Content al venir desde una
# página HTTPS.
CMD ["sh", "-c", "alembic upgrade head && python seed.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips=*"]
