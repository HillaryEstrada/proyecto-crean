// ============================================
// MODELO: bodega.model.js
// Descripción: Consultas SQL para bodega
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Crear bodega
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO bodega
        (nombre, descripcion, capacidad_ton, estado, registrado_por)
        VALUES($1, $2, $3, $4, $5)
        RETURNING *`,
        [
            data.nombre,
            data.descripcion    || null,
            data.capacidad_ton   || null,
            data.estado         || 'Operativo',
            data.registrado_por
        ]
    ),

    // ============================================
    // Listar bodegas activas (NO manteniemiento)
    // ============================================
    listar: () => Conexion.query(
        `SELECT
            b.*,
            usr.username AS registrado_por_usuario
        FROM bodega b
        LEFT JOIN users usr ON b.registrado_por = usr.pk_user
        WHERE b.estado = 'Operativo'
        ORDER BY b.pk_bodega ASC`
    ),

    // ============================================
    // Listar bodegas manteniemiento
    // ============================================
    listarMantenimiento: () => Conexion.query(
        `SELECT
            b.*,
            usr.username AS registrado_por_usuario
        FROM bodega b
        LEFT JOIN users usr ON b.registrado_por = usr.pk_user
        WHERE b.estado = 'En mantenimiento'
        ORDER BY b.pk_bodega ASC`
    ),

    // ============================================
    // Obtener por ID
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            b.*,
            usr.username AS registrado_por_usuario
        FROM bodega b
        LEFT JOIN users usr ON b.registrado_por = usr.pk_user
        WHERE b.pk_bodega = $1`,
        [id]
    ),

    // ============================================
    // Actualizar bodega
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE bodega
        SET
            nombre        = COALESCE($1, nombre),
            descripcion   = COALESCE($2, descripcion),
            capacidad_ton = COALESCE($3, capacidad_ton)
        WHERE pk_bodega = $4
        RETURNING *`,
        [
            data.nombre,
            data.descripcion   || null,
            data.capacidad_ton || null,
            id
        ]
    ),

    // ============================================
    // Desactivar — cambia estado a 'En mantenimiento'
    // ============================================
    desactivar: (id) => Conexion.query(
        `UPDATE bodega
         SET estado = 'En mantenimiento'
         WHERE pk_bodega = $1
         RETURNING *`,
        [id]
    ),

    // ============================================
    // Reactivar — cambia estado a 'Operativo'
    // ============================================
    reactivar: (id) => Conexion.query(
        `UPDATE bodega
         SET estado = 'Operativo'
         WHERE pk_bodega = $1
         RETURNING *`,
        [id]
    ),

    existeNombre: (nombre, idActual = null) => Conexion.query(
    `SELECT pk_bodega FROM bodega
     WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1))
     ${idActual ? 'AND pk_bodega != $2' : ''}`,
    idActual ? [nombre, idActual] : [nombre]
    ),
    
    tieneInventario: (id) => Conexion.query(
        `SELECT COALESCE(SUM(stock_kg), 0) AS total_stock
        FROM inventario_bodega
        WHERE fk_bodega = $1`,
        [id]
    ),

};