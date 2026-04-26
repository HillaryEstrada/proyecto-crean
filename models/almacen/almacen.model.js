// ============================================
// MODELO: almacen.model.js
// Descripción: Consultas SQL para almacen
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Crear almacen
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO almacen
        (nombre, descripcion, registrado_por)
        VALUES($1, $2, $3)
        RETURNING *`,
        [
            data.nombre,
            data.descripcion || null,
            data.registrado_por
        ]
    ),

    // ============================================
    // Listar almacenes activos (estado = 1)
    // ============================================
    listar: () => Conexion.query(
        `SELECT
            a.*,
            u.username AS registrado_por_usuario
        FROM almacen a
        LEFT JOIN users u ON a.registrado_por = u.pk_user
        WHERE a.estado = 1
        ORDER BY a.nombre ASC`
    ),

    // ============================================
    // Listar todos los almacenes (activos e inactivos)
    // ============================================
    listarTodos: () => Conexion.query(
        `SELECT
            a.*,
            u.username AS registrado_por_usuario
        FROM almacen a
        LEFT JOIN users u ON a.registrado_por = u.pk_user
        ORDER BY a.nombre ASC`
    ),

    // ============================================
    // Listar almacenes inactivos (estado = 0)
    // ============================================
    listarInactivos: () => Conexion.query(
        `SELECT
            a.*,
            u.username AS registrado_por_usuario
        FROM almacen a
        LEFT JOIN users u ON a.registrado_por = u.pk_user
        WHERE a.estado = 0
        ORDER BY a.nombre ASC`
    ),

    // ============================================
    // Obtener almacen por ID
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            a.*,
            u.username AS registrado_por_usuario
        FROM almacen a
        LEFT JOIN users u ON a.registrado_por = u.pk_user
        WHERE a.pk_almacen = $1`,
        [id]
    ),

    // ============================================
    // Actualizar almacen
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE almacen
        SET
            nombre      = COALESCE($1, nombre),
            descripcion = $2
        WHERE pk_almacen = $3
        RETURNING *`,
        [
            data.nombre,
            data.descripcion || null,
            id
        ]
    ),

    // ============================================
    // Desactivar almacen (baja lógica, estado = 0)
    // ============================================
    desactivar: (id) => Conexion.query(
        `UPDATE almacen SET estado = 0 WHERE pk_almacen = $1 RETURNING *`,
        [id]
    ),

    // ============================================
    // Reactivar almacen (estado = 1)
    // ============================================
    reactivar: (id) => Conexion.query(
        `UPDATE almacen SET estado = 1 WHERE pk_almacen = $1 RETURNING *`,
        [id]
    ),

    // ============================================
    // Verificar si el nombre ya existe (evitar duplicados)
    // ============================================
    existeNombre: (nombre, idActual = null) => Conexion.query(
        `SELECT pk_almacen FROM almacen
         WHERE LOWER(nombre) = LOWER($1) ${idActual ? `AND pk_almacen != $2` : ''}`,
        idActual ? [nombre, idActual] : [nombre]
    )

};