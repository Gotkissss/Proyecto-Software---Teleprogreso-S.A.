"""
seed.py — Datos iniciales para Teleprogreso S.A.
=================================================
Este script es IDEMPOTENTE y se encarga de todo:
  1. Verifica que PostGIS esté habilitado (y lo habilita si no lo está)
  2. Ejecuta las migraciones de Alembic si las tablas no existen
  3. Limpia TODAS las tablas con TRUNCATE CASCADE (respeta FKs)
  4. Inserta empleados y tareas de prueba

Uso (un solo comando):
    docker compose exec backend python seed.py
"""

import asyncio
import subprocess
import sys
from datetime import date, timedelta

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.security import hash_password
from app.models.empleado import Empleado, EmpleadoTarea
from app.models.tarea import Tarea

# ── Motor de base de datos ─────────────────────────────────────────────────
engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)


# ── Datos de prueba ────────────────────────────────────────────────────────
EMPLEADOS = [
    {
        "nombre": "Carlos",
        "apellido": "Administrador",
        "correo": "admin@teleprogreso.com",
        "contrasena": "Admin1234!",
        "rol": "admin",
        "estado": "activo",
        "telefono": "5550-0001",
        "fecha_contratacion": date(2020, 1, 15),
    },
    {
        "nombre": "Juan",
        "apellido": "Pérez García",
        "correo": "tecnico@teleprogreso.com",
        "contrasena": "Tecnico1234!",
        "rol": "tecnico",
        "estado": "activo",
        "telefono": "5550-0002",
        "fecha_contratacion": date(2022, 6, 1),
    },
]

HOY = date.today()

TAREAS = [
    {
        "titulo": "Instalación fibra óptica — Residencial Los Álamos",
        "descripcion": "Instalar acometida y ONT en apartamento 3B. El cliente ya cuenta con canaleta instalada.",
        "estado_tarea": "pendiente",
        "prioridad": "alta",
        "fecha_inicio": HOY,
        "fecha_finalizacion": HOY + timedelta(days=1),
        "direccion_servicio": "Calle 15, Ave. Circunvalación, Bloque B, Apto 3B, Fraijanes",
        "fecha_asignacion": HOY,
    },
    {
        "titulo": "Reparación de señal — Tienda El Ahorro",
        "descripcion": "El cliente reporta pérdida intermitente de señal desde hace 3 días. Revisar splitter y cable de bajada.",
        "estado_tarea": "en_progreso",
        "prioridad": "urgente",
        "fecha_inicio": HOY,
        "fecha_finalizacion": HOY,
        "direccion_servicio": "Barrio El Centro, 3 Calle 4-22, Local 5, Fraijanes",
        "fecha_asignacion": HOY,
    },
    {
        "titulo": "Mantenimiento preventivo — Carlos Mendoza",
        "descripcion": "Limpieza de conectores y revisión de niveles de señal. Contrato anual de mantenimiento.",
        "estado_tarea": "pendiente",
        "prioridad": "media",
        "fecha_inicio": HOY + timedelta(days=1),
        "fecha_finalizacion": HOY + timedelta(days=1),
        "direccion_servicio": "Col. Universidad, Casa 4, Zona 10, Fraijanes",
        "fecha_asignacion": HOY,
    },
    {
        "titulo": "Instalación TV Cable — Restaurante Sabor Latino",
        "descripcion": "Instalar 3 puntos de TV cable en el área del comedor. El cliente solicita canales de deportes y noticias.",
        "estado_tarea": "pendiente",
        "prioridad": "media",
        "fecha_inicio": HOY + timedelta(days=2),
        "fecha_finalizacion": HOY + timedelta(days=2),
        "direccion_servicio": "Bo. Guamilito, 5 Ave 4 Calle, Fraijanes",
        "fecha_asignacion": HOY,
    },
    {
        "titulo": "Revisión de equipo — María Josefa Rodríguez",
        "descripcion": "Cliente reporta que el router no enciende después de una tormenta eléctrica. Posible daño por sobretensión.",
        "estado_tarea": "pendiente",
        "prioridad": "alta",
        "fecha_inicio": HOY + timedelta(days=1),
        "fecha_finalizacion": HOY + timedelta(days=1),
        "direccion_servicio": "Res. El Portal, Senda 3, Casa 12, Fraijanes",
        "fecha_asignacion": HOY,
    },
    {
        "titulo": "Ampliación de red — Supermercado La Antorcha",
        "descripcion": "Agregar 5 puntos de red adicionales en bodega y oficinas administrativas. Ya se tiene el cable corrido.",
        "estado_tarea": "completado",
        "prioridad": "media",
        "fecha_inicio": HOY - timedelta(days=2),
        "fecha_finalizacion": HOY - timedelta(days=1),
        "direccion_servicio": "Salida a La Lima, KM 18.5, Fraijanes",
        "fecha_asignacion": HOY - timedelta(days=3),
    },
]


# ── Tablas a limpiar (orden inverso de dependencias) ──────────────────────
# TRUNCATE ... CASCADE respeta las FKs automáticamente, pero listarlas
# en orden es buena práctica por si algún día se quita el CASCADE.
TABLAS_A_LIMPIAR = [
    "ubicacion_empleado",
    "incidencia",
    "descanso",
    "asistencia",
    "carro_herramienta",
    "empleado_carro",
    "empleado_tarea",
    "tarea",
    "herramienta",
    "material",
    "carro",
    "activo",
    "empleado",
]


async def verificar_postgis(db: AsyncSession) -> None:
    """Verifica que PostGIS esté habilitado; si no, lo habilita."""
    result = await db.execute(
        text("SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'postgis')")
    )
    esta_habilitado = result.scalar()

    if not esta_habilitado:
        print("🔧 Habilitando PostGIS...")
        await db.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        await db.commit()
        print("   ✅ PostGIS habilitado")
    else:
        print("✅ PostGIS ya está habilitado")


async def verificar_tablas(db: AsyncSession) -> bool:
    """Verifica si las tablas principales existen."""
    result = await db.execute(
        text(
            "SELECT EXISTS("
            "  SELECT 1 FROM information_schema.tables "
            "  WHERE table_schema = 'public' AND table_name = 'empleado'"
            ")"
        )
    )
    return bool(result.scalar())


def ejecutar_migraciones() -> None:
    """Ejecuta `alembic upgrade head` desde Python."""
    print("📦 Ejecutando migraciones de Alembic...")
    resultado = subprocess.run(
        ["alembic", "upgrade", "head"],
        capture_output=True,
        text=True,
    )
    if resultado.returncode != 0:
        print("   ❌ Error al ejecutar migraciones:")
        print(resultado.stderr)
        sys.exit(1)
    print("   ✅ Migraciones aplicadas")


async def limpiar_tablas(db: AsyncSession) -> None:
    """Limpia todas las tablas usando TRUNCATE ... RESTART IDENTITY CASCADE."""
    print("🗑️  Limpiando datos anteriores...")
    tablas = ", ".join(TABLAS_A_LIMPIAR)
    await db.execute(text(f"TRUNCATE {tablas} RESTART IDENTITY CASCADE"))
    await db.commit()
    print("   ✅ Tablas limpias")


async def crear_empleados(db: AsyncSession) -> list[Empleado]:
    print("\n👤 Creando empleados...")
    empleados_creados: list[Empleado] = []

    for datos in EMPLEADOS:
        emp = Empleado(
            nombre=datos["nombre"],
            apellido=datos["apellido"],
            correo=datos["correo"],
            hash_contrasena=hash_password(datos["contrasena"]),
            rol=datos["rol"],
            estado=datos["estado"],
            telefono=datos["telefono"],
            fecha_contratacion=datos["fecha_contratacion"],
        )
        db.add(emp)
        empleados_creados.append(emp)

    await db.flush()

    for emp, datos in zip(empleados_creados, EMPLEADOS):
        print(f"   ✅ {emp.rol.upper():10s} | {emp.nombre} {emp.apellido}")
        print(f"             correo: {emp.correo}")
        print(f"             pass:   {datos['contrasena']}")

    return empleados_creados


async def crear_tareas(db: AsyncSession) -> list[Tarea]:
    print("\n📋 Creando tareas...")
    tareas_creadas: list[Tarea] = []

    for datos in TAREAS:
        tarea = Tarea(
            titulo=datos["titulo"],
            descripcion=datos["descripcion"],
            estado_tarea=datos["estado_tarea"],
            prioridad=datos["prioridad"],
            fecha_inicio=datos["fecha_inicio"],
            fecha_finalizacion=datos["fecha_finalizacion"],
            direccion_servicio=datos["direccion_servicio"],
            fecha_asignacion=datos["fecha_asignacion"],
        )
        db.add(tarea)
        tareas_creadas.append(tarea)

    await db.flush()

    for tarea in tareas_creadas:
        icon = {"pendiente": "⏳", "en_progreso": "🔧", "completado": "✅"}.get(
            tarea.estado_tarea, "❓"
        )
        print(f"   {icon} [{tarea.prioridad.upper():7s}] {tarea.titulo[:55]}")

    return tareas_creadas


async def asignar_tareas(
    db: AsyncSession, tecnico: Empleado, tareas: list[Tarea]
) -> None:
    print(f"\n🔗 Asignando tareas a {tecnico.nombre} {tecnico.apellido}...")
    for tarea in tareas:
        db.add(EmpleadoTarea(id_empleado=tecnico.id_empleado, id_tarea=tarea.id_tarea))
    await db.commit()
    print(f"   ✅ {len(tareas)} tareas asignadas")


def imprimir_resumen(empleados: list[Empleado]) -> None:
    print("\n" + "=" * 55)
    print("  🎉  Seed completado exitosamente")
    print("=" * 55)
    print("\n  Credenciales de acceso:")
    print(f"  {'Rol':<10}  {'Correo':<35}  Contraseña")
    print(f"  {'-'*10}  {'-'*35}  {'-'*14}")
    for emp, datos in zip(empleados, EMPLEADOS):
        print(f"  {emp.rol:<10}  {emp.correo:<35}  {datos['contrasena']}")
    print()


async def seed() -> None:
    # 1. Verificar PostGIS antes de cualquier migración
    async with AsyncSessionLocal() as db:
        await verificar_postgis(db)
        tablas_existen = await verificar_tablas(db)

    # 2. Correr migraciones si las tablas no existen
    if not tablas_existen:
        ejecutar_migraciones()
    else:
        print("✅ Tablas ya existen, omitiendo migraciones")

    # 3. Limpiar e insertar datos
    async with AsyncSessionLocal() as db:
        await limpiar_tablas(db)
        empleados = await crear_empleados(db)
        tareas = await crear_tareas(db)
        tecnico = empleados[1]  # Juan Pérez
        await asignar_tareas(db, tecnico, tareas)
        imprimir_resumen(empleados)

    # 4. Cerrar el motor limpiamente
    await engine.dispose()


if __name__ == "__main__":
    try:
        asyncio.run(seed())
    except Exception as e:
        print(f"\n❌ Error durante el seed: {e}")
        sys.exit(1)