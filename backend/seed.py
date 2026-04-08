"""
seed.py — Datos iniciales para Teleprogreso S.A.
=================================================
Crea 2 usuarios (admin + técnico) y algunas tareas de prueba.

Uso:
    # Desde la carpeta backend/, con el .env configurado:
    python seed.py

    # O dentro del contenedor Docker:
    docker exec -it teleprogreso_backend python seed.py
"""

import asyncio
from datetime import date, timedelta

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.security import hash_password
from app.models.empleado import Empleado, EmpleadoTarea
from app.models.tarea import Tarea

# ── Motor de base de datos ─────────────────────────────────────────────────
engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


# ── Datos de prueba ────────────────────────────────────────────────────────

EMPLEADOS = [
    {
        "nombre":             "Carlos",
        "apellido":           "Administrador",
        "correo":             "admin@teleprogreso.com",
        "contrasena":         "Admin1234!",
        "rol":                "admin",
        "estado":             "activo",
        "telefono":           "5550-0001",
        "fecha_contratacion": date(2020, 1, 15),
    },
    {
        "nombre":             "Juan",
        "apellido":           "Pérez García",
        "correo":             "tecnico@teleprogreso.com",
        "contrasena":         "Tecnico1234!",
        "rol":                "tecnico",
        "estado":             "activo",
        "telefono":           "5550-0002",
        "fecha_contratacion": date(2022, 6, 1),
    },
]

HOY = date.today()

TAREAS = [
    {
        "titulo":             "Instalación fibra óptica — Residencial Los Álamos",
        "descripcion":        "Instalar acometida y ONT en apartamento 3B. El cliente ya cuenta con canaleta instalada.",
        "estado_tarea":       "pendiente",
        "prioridad":          "alta",
        "fecha_inicio":       HOY,
        "fecha_finalizacion": HOY + timedelta(days=1),
        "direccion_servicio": "Calle 15, Ave. Circunvalación, Bloque B, Apto 3B, Fraijanes",
        "fecha_asignacion":   HOY,
    },
    {
        "titulo":             "Reparación de señal — Tienda El Ahorro",
        "descripcion":        "El cliente reporta pérdida intermitente de señal desde hace 3 días. Revisar splitter y cable de bajada.",
        "estado_tarea":       "en_progreso",
        "prioridad":          "urgente",
        "fecha_inicio":       HOY,
        "fecha_finalizacion": HOY,
        "direccion_servicio": "Barrio El Centro, 3 Calle 4-22, Local 5, Fraijanes",
        "fecha_asignacion":   HOY,
    },
    {
        "titulo":             "Mantenimiento preventivo — Carlos Mendoza",
        "descripcion":        "Limpieza de conectores y revisión de niveles de señal. Contrato anual de mantenimiento.",
        "estado_tarea":       "pendiente",
        "prioridad":          "media",
        "fecha_inicio":       HOY + timedelta(days=1),
        "fecha_finalizacion": HOY + timedelta(days=1),
        "direccion_servicio": "Col. Universidad, Casa 4, Zona 10, Fraijanes",
        "fecha_asignacion":   HOY,
    },
    {
        "titulo":             "Instalación TV Cable — Restaurante Sabor Latino",
        "descripcion":        "Instalar 3 puntos de TV cable en el área del comedor. El cliente solicita canales de deportes y noticias.",
        "estado_tarea":       "pendiente",
        "prioridad":          "media",
        "fecha_inicio":       HOY + timedelta(days=2),
        "fecha_finalizacion": HOY + timedelta(days=2),
        "direccion_servicio": "Bo. Guamilito, 5 Ave 4 Calle, Fraijanes",
        "fecha_asignacion":   HOY,
    },
    {
        "titulo":             "Revisión de equipo — María Josefa Rodríguez",
        "descripcion":        "Cliente reporta que el router no enciende después de una tormenta eléctrica. Posible daño por sobretensión.",
        "estado_tarea":       "pendiente",
        "prioridad":          "alta",
        "fecha_inicio":       HOY + timedelta(days=1),
        "fecha_finalizacion": HOY + timedelta(days=1),
        "direccion_servicio": "Res. El Portal, Senda 3, Casa 12, Fraijanes",
        "fecha_asignacion":   HOY,
    },
    {
        "titulo":             "Ampliación de red — Supermercado La Antorcha",
        "descripcion":        "Agregar 5 puntos de red adicionales en bodega y oficinas administrativas. Ya se tiene el cable corrido.",
        "estado_tarea":       "completado",
        "prioridad":          "media",
        "fecha_inicio":       HOY - timedelta(days=2),
        "fecha_finalizacion": HOY - timedelta(days=1),
        "direccion_servicio": "Salida a La Lima, KM 18.5, Fraijanes",
        "fecha_asignacion":   HOY - timedelta(days=3),
    },
]


# ── Función principal ──────────────────────────────────────────────────────

async def seed():
    async with AsyncSessionLocal() as db:

        # ── 1. Limpiar datos existentes (orden inverso por FKs) ────────────
        print("🗑️  Limpiando datos anteriores...")
        await db.execute(text("DELETE FROM empleado_tarea"))
        await db.execute(text("DELETE FROM tarea"))
        await db.execute(text("DELETE FROM empleado"))
        await db.commit()

        # ── 2. Crear empleados ────────────────────────────────────────────
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

        await db.flush()  # obtiene los IDs generados

        for emp, datos in zip(empleados_creados, EMPLEADOS):
            print(f"   ✅ {emp.rol.upper():10s} | {emp.nombre} {emp.apellido}")
            print(f"             correo: {emp.correo}")
            print(f"             pass:   {datos['contrasena']}")

        # ── 3. Crear tareas ───────────────────────────────────────────────
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
            estado_icon = {"pendiente": "⏳", "en_progreso": "🔧", "completado": "✅"}.get(tarea.estado_tarea, "❓")
            print(f"   {estado_icon} [{tarea.prioridad.upper():7s}] {tarea.titulo[:55]}")

        # ── 4. Asignar todas las tareas al técnico ────────────────────────
        tecnico = empleados_creados[1]  # Juan Pérez (índice 1)

        print(f"\n🔗 Asignando tareas a {tecnico.nombre} {tecnico.apellido}...")
        for tarea in tareas_creadas:
            asignacion = EmpleadoTarea(
                id_empleado=tecnico.id_empleado,
                id_tarea=tarea.id_tarea,
            )
            db.add(asignacion)

        await db.commit()
        print(f"   ✅ {len(tareas_creadas)} tareas asignadas")

        # ── Resumen final ─────────────────────────────────────────────────
        print("\n" + "=" * 55)
        print("  🎉  Seed completado exitosamente")
        print("=" * 55)
        print("\n  Credenciales de acceso:")
        print(f"  {'Rol':<10}  {'Correo':<35}  Contraseña")
        print(f"  {'-'*10}  {'-'*35}  {'-'*14}")
        for emp, datos in zip(empleados_creados, EMPLEADOS):
            print(f"  {emp.rol:<10}  {emp.correo:<35}  {datos['contrasena']}")
        print()


if __name__ == "__main__":
    asyncio.run(seed())