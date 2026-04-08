from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# Motor async para PostgreSQL
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,        # Cambia a True si quieres ver el SQL en consola para debug
    future=True,
)

# Fábrica de sesiones
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# Dependency injection para los endpoints de FastAPI
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise