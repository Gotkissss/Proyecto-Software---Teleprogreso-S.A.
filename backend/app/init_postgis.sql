-- =============================================================
-- init_postgis.sql
-- -------------------------------------------------------------
-- Script de inicialización automática de PostgreSQL.
-- Postgres ejecuta automáticamente cualquier archivo .sql que
-- esté en /docker-entrypoint-initdb.d/ la PRIMERA vez que se
-- crea la base de datos (cuando el volumen está vacío).
--
-- Habilita las extensiones PostGIS necesarias para los campos
-- de tipo Geography usados en tareas, asistencias y ubicaciones.
-- =============================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;