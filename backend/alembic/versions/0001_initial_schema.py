"""Esquema inicial — Teleprogreso S.A.

Revision ID: 0001
Revises: —
Create Date: 2026-04-08
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── empleado ──────────────────────────────────────────────────────────
    op.create_table(
        "empleado",
        sa.Column("id_empleado", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("rol", sa.String(30), nullable=False),
        sa.Column("estado", sa.String(20), nullable=False, server_default="activo"),
        sa.Column("hash_contrasena", sa.String(255), nullable=False),
        sa.Column("correo", sa.String(100), nullable=False, unique=True),
        sa.Column("fecha_contratacion", sa.Date(), nullable=False),
        sa.Column("fecha_registro", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("ultimo_acceso", sa.DateTime(), nullable=True),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("apellido", sa.String(100), nullable=False),
        sa.Column("telefono", sa.String(20), nullable=True),
    )
    op.create_index("ix_empleado_correo", "empleado", ["correo"])

    # ── activo ────────────────────────────────────────────────────────────
    op.create_table(
        "activo",
        sa.Column("id_activo", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("nombre_activo", sa.String(150), nullable=False),
        sa.Column("fecha_registro", sa.Date(), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("tipo", sa.String(20), nullable=False),
    )

    # ── carro ─────────────────────────────────────────────────────────────
    op.create_table(
        "carro",
        sa.Column("id_activo", sa.Integer(), sa.ForeignKey("activo.id_activo", ondelete="CASCADE"), primary_key=True),
        sa.Column("placa", sa.String(20), nullable=False, unique=True),
        sa.Column("marca", sa.String(80), nullable=True),
        sa.Column("modelo", sa.String(80), nullable=True),
        sa.Column("capacidad", sa.Integer(), nullable=True),
        sa.Column("estado_vehiculo", sa.String(30), nullable=False, server_default="disponible"),
    )

    # ── material ──────────────────────────────────────────────────────────
    op.create_table(
        "material",
        sa.Column("id_activo", sa.Integer(), sa.ForeignKey("activo.id_activo", ondelete="CASCADE"), primary_key=True),
        sa.Column("cantidad_disponible", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("stock_minimo", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("unidad_medida", sa.String(30), nullable=True),
        sa.Column("tipo_material", sa.String(80), nullable=True),
    )

    # ── herramienta ───────────────────────────────────────────────────────
    op.create_table(
        "herramienta",
        sa.Column("id_activo", sa.Integer(), sa.ForeignKey("activo.id_activo", ondelete="CASCADE"), primary_key=True),
        sa.Column("tipo_herramienta", sa.String(80), nullable=True),
        sa.Column("marca", sa.String(80), nullable=True),
        sa.Column("modelo", sa.String(80), nullable=True),
        sa.Column("estado", sa.String(30), nullable=False, server_default="disponible"),
    )

    # ── carro_herramienta ─────────────────────────────────────────────────
    op.create_table(
        "carro_herramienta",
        sa.Column("id_carro", sa.Integer(), sa.ForeignKey("carro.id_activo", ondelete="CASCADE"), primary_key=True),
        sa.Column("id_herramienta", sa.Integer(), sa.ForeignKey("herramienta.id_activo", ondelete="CASCADE"), primary_key=True),
        sa.Column("fecha_asignacion", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("estado_entrega", sa.String(30), nullable=True),
        sa.Column("comentario", sa.Text(), nullable=True),
    )

    # ── tarea ─────────────────────────────────────────────────────────────
    op.create_table(
        "tarea",
        sa.Column("id_tarea", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("titulo", sa.String(150), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("estado_tarea", sa.String(30), nullable=False, server_default="pendiente"),
        sa.Column("prioridad", sa.String(20), nullable=False, server_default="media"),
        sa.Column("fecha_inicio", sa.Date(), nullable=True),
        sa.Column("fecha_finalizacion", sa.Date(), nullable=True),
        sa.Column("direccion_servicio", sa.String(255), nullable=True),
        sa.Column("coordenada_servicio", sa.Geography(geometry_type="POINT", srid=4326), nullable=True),
        sa.Column("fecha_asignacion", sa.Date(), nullable=True),
    )
    op.create_index("ix_tarea_estado", "tarea", ["estado_tarea"])

    # ── empleado_tarea ────────────────────────────────────────────────────
    op.create_table(
        "empleado_tarea",
        sa.Column("id_empleado", sa.Integer(), sa.ForeignKey("empleado.id_empleado", ondelete="CASCADE"), primary_key=True),
        sa.Column("id_tarea", sa.Integer(), sa.ForeignKey("tarea.id_tarea", ondelete="CASCADE"), primary_key=True),
    )

    # ── empleado_carro ────────────────────────────────────────────────────
    op.create_table(
        "empleado_carro",
        sa.Column("id_empleado", sa.Integer(), sa.ForeignKey("empleado.id_empleado", ondelete="CASCADE"), primary_key=True),
        sa.Column("id_carro", sa.Integer(), sa.ForeignKey("carro.id_activo", ondelete="CASCADE"), primary_key=True),
    )

    # ── asistencia ────────────────────────────────────────────────────────
    op.create_table(
        "asistencia",
        sa.Column("id_asistencia", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("id_empleado", sa.Integer(), sa.ForeignKey("empleado.id_empleado", ondelete="CASCADE"), nullable=False),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("hora_entrada", sa.Time(), nullable=False),
        sa.Column("hora_salida", sa.Time(), nullable=True),
        sa.Column("coordenada_entrada", sa.Geography(geometry_type="POINT", srid=4326), nullable=True),
        sa.Column("coordenada_salida", sa.Geography(geometry_type="POINT", srid=4326), nullable=True),
    )
    op.create_index("ix_asistencia_empleado_fecha", "asistencia", ["id_empleado", "fecha"])

    # ── descanso ──────────────────────────────────────────────────────────
    op.create_table(
        "descanso",
        sa.Column("id_descanso", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("id_asistencia", sa.Integer(), sa.ForeignKey("asistencia.id_asistencia", ondelete="CASCADE"), nullable=False),
        sa.Column("hora_inicio", sa.Time(), nullable=False),
        sa.Column("hora_fin", sa.Time(), nullable=True),
    )

    # ── incidencia ────────────────────────────────────────────────────────
    op.create_table(
        "incidencia",
        sa.Column("id_incidencia", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("id_tarea", sa.Integer(), sa.ForeignKey("tarea.id_tarea", ondelete="CASCADE"), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("foto_evidencia", sa.String(500), nullable=True),
        sa.Column("fecha_reporte", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
    )

    # ── ubicacion_empleado ────────────────────────────────────────────────
    op.create_table(
        "ubicacion_empleado",
        sa.Column("id_ubicacion", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("id_empleado", sa.Integer(), sa.ForeignKey("empleado.id_empleado", ondelete="CASCADE"), nullable=False),
        sa.Column("fecha_hora_registro", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("coordenada", sa.Geography(geometry_type="POINT", srid=4326), nullable=False),
    )
    op.create_index("ix_ubicacion_empleado", "ubicacion_empleado", ["id_empleado"])


def downgrade() -> None:
    op.drop_index("ix_ubicacion_empleado", table_name="ubicacion_empleado")
    op.drop_table("ubicacion_empleado")
    op.drop_table("incidencia")
    op.drop_table("descanso")
    op.drop_index("ix_asistencia_empleado_fecha", table_name="asistencia")
    op.drop_table("asistencia")
    op.drop_table("empleado_carro")
    op.drop_table("empleado_tarea")
    op.drop_index("ix_tarea_estado", table_name="tarea")
    op.drop_table("tarea")
    op.drop_table("carro_herramienta")
    op.drop_table("herramienta")
    op.drop_table("material")
    op.drop_table("carro")
    op.drop_table("activo")
    op.drop_index("ix_empleado_correo", table_name="empleado")
    op.drop_table("empleado")