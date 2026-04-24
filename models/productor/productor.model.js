// ============================================
// MODELO: productor.model.js
// Descripción: Consultas SQL para productor
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Crear productor
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO productor
        (nombre, telefono, observaciones, registrado_por)
        VALUES($1, $2, $3, $4)
        RETURNING *`,
        [
            data.nombre,
            data.telefono      || null,
            data.observaciones || null,
            data.registrado_por
        ]
    ),

    // ============================================
    // Listar productores activos (estado = 1)
    // ============================================
    listar: () => Conexion.query(
        `SELECT
            p.*,
            usr.username AS registrado_por_usuario
        FROM productor p
        LEFT JOIN users usr ON p.registrado_por = usr.pk_user
        WHERE p.estado = 1
        ORDER BY p.pk_productor ASC`
    ),

    // ============================================
    // Listar productores inactivos (estado = 0)
    // ============================================
    listarInactivos: () => Conexion.query(
        `SELECT
            p.*,
            usr.username AS registrado_por_usuario
        FROM productor p
        LEFT JOIN users usr ON p.registrado_por = usr.pk_user
        WHERE p.estado = 0
        ORDER BY p.pk_productor ASC`
    ),

    // ============================================
    // Obtener por ID
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            p.*,
            usr.username AS registrado_por_usuario
        FROM productor p
        LEFT JOIN users usr ON p.registrado_por = usr.pk_user
        WHERE p.pk_productor = $1`,
        [id]
    ),

    // ============================================
    // Actualizar productor
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE productor
        SET
            nombre        = COALESCE($1, nombre),
            telefono      = COALESCE($2, telefono),
            observaciones = COALESCE($3, observaciones)
        WHERE pk_productor = $4
        RETURNING *`,
        [
            data.nombre,
            data.telefono      || null,
            data.observaciones || null,
            id
        ]
    ),

    // ============================================
    // Desactivar — baja lógica (estado = 0)
    // ============================================
    desactivar: (id) => Conexion.query(
        `UPDATE productor
         SET estado = 0
         WHERE pk_productor = $1
         RETURNING *`,
        [id]
    ),

    // ============================================
    // Reactivar (estado = 1)
    // ============================================
    reactivar: (id) => Conexion.query(
        `UPDATE productor
         SET estado = 1
         WHERE pk_productor = $1
         RETURNING *`,
        [id]
    ),

    // ============================================
    // Verificar si el nombre ya existe
    // ============================================
    existeNombre: (nombre) => Conexion.query(
        `SELECT pk_productor FROM productor
         WHERE LOWER(nombre) = LOWER($1)`,
        [nombre]
    )

};