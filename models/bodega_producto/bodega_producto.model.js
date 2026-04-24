// ============================================
// MODELO: bodega_producto.model.js
// Descripción: Consultas SQL para productos de bodega
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Crear producto
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO bodega_producto
        (nombre, tipo_grano, variedad, descripcion, registrado_por)
        VALUES($1, $2, $3, $4, $5)
        RETURNING *`,
        [
            data.nombre,
            data.tipo_grano  || null,
            data.variedad    || null,
            data.descripcion || null,
            data.registrado_por
        ]
    ),

    // ============================================
    // Listar productos activos (estado = 1)
    // ============================================
    listar: () => Conexion.query(
        `SELECT
            bp.*,
            usr.username AS registrado_por_usuario
        FROM bodega_producto bp
        LEFT JOIN users usr ON bp.registrado_por = usr.pk_user
        WHERE bp.estado = 1
        ORDER BY bp.pk_producto ASC`
    ),

    // ============================================
    // Obtener por ID (con detalles completos)
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            bp.*,
            usr.username AS registrado_por_usuario
        FROM bodega_producto bp
        LEFT JOIN users usr ON bp.registrado_por = usr.pk_user
        WHERE bp.pk_producto = $1`,
        [id]
    ),

    // ============================================
    // Actualizar producto
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE bodega_producto
        SET
            nombre      = COALESCE($1, nombre),
            tipo_grano  = COALESCE($2, tipo_grano),
            variedad    = COALESCE($3, variedad),
            descripcion = COALESCE($4, descripcion)
        WHERE pk_producto = $5
        RETURNING *`,
        [
            data.nombre,
            data.tipo_grano  || null,
            data.variedad    || null,
            data.descripcion || null,
            id
        ]
    ),

    // ============================================
    // Desactivar — baja lógica (estado = 0)
    // ============================================
    desactivar: (id) => Conexion.query(
        `UPDATE bodega_producto
         SET estado = 0
         WHERE pk_producto = $1
         RETURNING *`,
        [id]
    ),

    // ============================================
    // Reactivar (estado = 1)
    // ============================================
    reactivar: (id) => Conexion.query(
        `UPDATE bodega_producto
         SET estado = 1
         WHERE pk_producto = $1
         RETURNING *`,
        [id]
    ),

    // ============================================
    // Listar productos inactivos (estado = 0)
    // ============================================
    listarInactivos: () => Conexion.query(
        `SELECT
            bp.*,
            usr.username AS registrado_por_usuario
        FROM bodega_producto bp
        LEFT JOIN users usr ON bp.registrado_por = usr.pk_user
        WHERE bp.estado = 0
        ORDER BY bp.pk_producto ASC`
    ),

    // ============================================
    // Verificar si el nombre ya existe
    // ============================================
    existeNombre: (nombre) => Conexion.query(
        `SELECT pk_producto FROM bodega_producto
         WHERE LOWER(nombre) = LOWER($1)`,
        [nombre]
    )

};