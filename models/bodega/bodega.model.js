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
        (nombre, descripcion, capacidad_kg, estado, registrado_por)
        VALUES($1, $2, $3, $4, $5)
        RETURNING *`,
        [
            data.nombre,
            data.descripcion    || null,
            data.capacidad_kg   || null,
            data.estado         || 'Operativo',
            data.registrado_por
        ]
    ),

    // ============================================
    // Listar bodegas activas (NO inhabilitadas)
    // ============================================
    listar: () => Conexion.query(
        `SELECT
            b.*,
            usr.username AS registrado_por_usuario
        FROM bodega b
        LEFT JOIN users usr ON b.registrado_por = usr.pk_user
        WHERE b.estado != 'Inhabilitada'
        ORDER BY b.pk_bodega ASC`
    ),

    // ============================================
    // Listar bodegas inhabilitadas
    // ============================================
    listarInhabilitadas: () => Conexion.query(
        `SELECT
            b.*,
            usr.username AS registrado_por_usuario
        FROM bodega b
        LEFT JOIN users usr ON b.registrado_por = usr.pk_user
        WHERE b.estado = 'Inhabilitada'
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
            nombre       = COALESCE($1, nombre),
            descripcion  = COALESCE($2, descripcion),
            capacidad_kg = COALESCE($3, capacidad_kg),
            estado       = COALESCE($4, estado)
        WHERE pk_bodega = $5
        RETURNING *`,
        [
            data.nombre,
            data.descripcion  || null,
            data.capacidad_kg || null,
            data.estado       || null,
            id
        ]
    ),

    // ============================================
    // Desactivar — cambia estado a 'Inhabilitada'
    // ============================================
    desactivar: (id) => Conexion.query(
        `UPDATE bodega
         SET estado = 'Inhabilitada'
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
    )

};