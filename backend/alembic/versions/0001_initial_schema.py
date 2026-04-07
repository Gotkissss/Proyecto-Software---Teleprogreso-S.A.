"""Esquema inicial — Teleprogreso S.A.

Tablas base del sistema según diagrama ER del Corte 3:
  usuarios, roles, usuario_roles, activos, servicios,
  asistencias, incidencias, uso_activos, notificaciones

Revision ID: 0001
Revises: —
Create Date: 2026-04-07
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── roles ──────────────────────────────────────────────────────────────
    op.create_table(
        "roles",
        sa.Column("id_rol", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("nombre_rol", sa.String(50), nullable=False, unique=True),
        sa.Column("descripcion", sa.Text(), nullable=True),
    )

    # Roles base del sistema
    op.execute("""
        INSERT INTO roles (nombre_rol, descripcion) VALUES
        ('admin',      'Administrador del sistema'),
        ('supervisor', 'Supervisor operativo'),
        ('tecnico',    'Técnico de campo'),
        ('gerente',    'Gerente general')
    """)

    # ── usuarios ───────────────────────────────────────────────────────────
    op.create_table(
        "usuarios",
        sa.Column("id_usuario", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("nombre_completo", sa.String(150), nullable=False),
        sa.Column("correo", sa.String(150), nullable=False, unique=True),
        sa.Column("contrasena_hash", sa.String(255), nullable=False),
        sa.Column("cargo", sa.String(100), nullable=True),
        sa.Column("telefono", sa.String(20), nullable=True),
        sa.Column(
            "estado_usuario",
            sa.Enum("activo", "inactivo", name="estado_usuario_enum"),
            nullable=False,
            server_default="activo",
        ),
        sa.Column(
            "fecha_creacion",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column("ultimo_acceso", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_index("ix_usuarios_correo", "usuarios", ["correo"])

    # ── usuario_roles (N:M) ────────────────────────────────────────────────
    op.create_table(
        "usuario_roles",
        sa.Column(
            "id_usuario",
            sa.Integer(),
            sa.ForeignKey("usuarios.id_usuario", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "id_rol",
            sa.Integer(),
            sa.ForeignKey("roles.id_rol", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "fecha_asignacion",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # ── activos ────────────────────────────────────────────────────────────
    op.create_table(
        "activos",
        sa.Column("id_activo", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("nombre", sa.String(150), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column(
            "tipo",
            sa.Enum("vehiculo", "herramienta", name="tipo_activo_enum"),
            nullable=False,
        ),
        sa.Column("codigo", sa.String(50), nullable=True, unique=True),
        # Campos específicos de vehículo
        sa.Column("marca", sa.String(80), nullable=True),
        sa.Column("modelo", sa.String(80), nullable=True),
        sa.Column("placa", sa.String(20), nullable=True, unique=True),
        sa.Column("capacidad", sa.String(50), nullable=True),
        sa.Column(
            "estado_vehiculo",
            sa.Enum("operativo", "en_mantenimiento", "fuera_de_servicio", name="estado_vehiculo_enum"),
            nullable=True,
        ),
        # Campos específicos de herramienta
        sa.Column("tipo_herramienta", sa.String(80), nullable=True),
        # Campos comunes
        sa.Column(
            "disponibilidad",
            sa.Enum("disponible", "en_uso", "en_mantenimiento", name="disponibilidad_activo_enum"),
            nullable=False,
            server_default="disponible",
        ),
        sa.Column(
            "fecha_registro",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )
    op.create_index("ix_activos_tipo", "activos", ["tipo"])

    # ── servicios (tareas) ─────────────────────────────────────────────────
    op.create_table(
        "servicios",
        sa.Column("id_servicio", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("nombre", sa.String(150), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("direccion", sa.String(255), nullable=True),
        sa.Column(
            "estado",
            sa.Enum("pendiente", "en_progreso", "completado", "cancelado", name="estado_servicio_enum"),
            nullable=False,
            server_default="pendiente",
        ),
        sa.Column(
            "prioridad",
            sa.Enum("baja", "media", "alta", "urgente", name="prioridad_servicio_enum"),
            nullable=False,
            server_default="media",
        ),
        sa.Column(
            "id_tecnico",
            sa.Integer(),
            sa.ForeignKey("usuarios.id_usuario", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "id_supervisor",
            sa.Integer(),
            sa.ForeignKey("usuarios.id_usuario", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("fecha_limite", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("fecha_asignacion", sa.TIMESTAMP(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("fecha_inicio_real", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("fecha_fin_real", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("titulo", sa.String(200), nullable=True),
    )
    op.create_index("ix_servicios_estado", "servicios", ["estado"])
    op.create_index("ix_servicios_id_tecnico", "servicios", ["id_tecnico"])

    # ── asistencias ────────────────────────────────────────────────────────
    op.create_table(
        "asistencias",
        sa.Column("id_asistencia", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "id_usuario",
            sa.Integer(),
            sa.ForeignKey("usuarios.id_usuario", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("hora_entrada", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("hora_salida", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("lat_entrada", sa.Numeric(10, 7), nullable=True),
        sa.Column("lon_entrada", sa.Numeric(10, 7), nullable=True),
        sa.Column("minutos_descanso", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("horas_extra", sa.Float(), nullable=False, server_default="0"),
    )
    op.create_index("ix_asistencias_usuario_fecha", "asistencias", ["id_usuario", "fecha"])

    # ── incidencias ────────────────────────────────────────────────────────
    op.create_table(
        "incidencias",
        sa.Column("id_incidencia", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "id_usuario",
            sa.Integer(),
            sa.ForeignKey("usuarios.id_usuario", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "id_servicio",
            sa.Integer(),
            sa.ForeignKey("servicios.id_servicio", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "id_activo",
            sa.Integer(),
            sa.ForeignKey("activos.id_activo", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("titulo", sa.String(200), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column(
            "estado_tarea",
            sa.Enum("abierta", "en_revision", "resuelta", name="estado_incidencia_enum"),
            nullable=False,
            server_default="abierta",
        ),
        sa.Column("evidencia_url", sa.String(500), nullable=True),
        sa.Column("fecha_reporte", sa.TIMESTAMP(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("fecha_resolucion", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("descripcion_resolucion", sa.Text(), nullable=True),
    )

    # ── uso_activos ────────────────────────────────────────────────────────
    op.create_table(
        "uso_activos",
        sa.Column("id_uso", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "id_activo",
            sa.Integer(),
            sa.ForeignKey("activos.id_activo", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "id_usuario",
            sa.Integer(),
            sa.ForeignKey("usuarios.id_usuario", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "id_servicio",
            sa.Integer(),
            sa.ForeignKey("servicios.id_servicio", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("fecha_inicio_uso", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("fecha_fin_uso", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("comentario_devolucion", sa.Text(), nullable=True),
    )

    # ── notificaciones ─────────────────────────────────────────────────────
    op.create_table(
        "notificaciones",
        sa.Column("id_notificacion", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "id_usuario_destino",
            sa.Integer(),
            sa.ForeignKey("usuarios.id_usuario", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "tipo",
            sa.Enum("alerta", "asignacion", "incidencia", "sistema", name="tipo_notificacion_enum"),
            nullable=False,
        ),
        sa.Column("mensaje", sa.Text(), nullable=False),
        sa.Column("leida", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("fecha_envio", sa.TIMESTAMP(timezone=True), server_default=sa.text("NOW()")),
    )
    op.create_index("ix_notificaciones_usuario_leida", "notificaciones", ["id_usuario_destino", "leida"])


def downgrade() -> None:
    op.drop_table("notificaciones")
    op.drop_table("uso_activos")
    op.drop_table("incidencias")
    op.drop_table("asistencias")
    op.drop_table("servicios")
    op.drop_table("activos")
    op.drop_table("usuario_roles")
    op.drop_table("usuarios")
    op.drop_table("roles")

    # Eliminar tipos ENUM
    for enum_name in [
        "estado_usuario_enum",
        "tipo_activo_enum",
        "estado_vehiculo_enum",
        "disponibilidad_activo_enum",
        "estado_servicio_enum",
        "prioridad_servicio_enum",
        "estado_incidencia_enum",
        "tipo_notificacion_enum",
    ]:
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")
