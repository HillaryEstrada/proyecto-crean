// ============================================
// MODELO: predio.model.js
// Descripción: Consultas SQL para predio
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Crear predio
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO predio
        (nombre, fk_ejido, registrado_por)
        VALUES($1, $2, $3)
        RETURNING *`,
        [
            data.nombre,
            data.fk_ejido || null,
            data.registrado_por
        ]
    ),

    // ============================================
    // Listar predios activos (estado = 1)
    // ============================================
    listar: () => Conexion.query(
        `SELECT
            p.*,
            e.nombre    AS ejido_nombre,
            u.username  AS registrado_por_usuario
        FROM predio p
        LEFT JOIN ejido e ON p.fk_ejido = e.pk_ejido
        LEFT JOIN users u ON p.registrado_por = u.pk_user
        WHERE p.estado = 1
        ORDER BY p.nombre ASC`
    ),

    // ============================================
    // Listar todos los predios (activos e inactivos)
    // ============================================
    listarTodos: () => Conexion.query(
        `SELECT
            p.*,
            e.nombre    AS ejido_nombre,
            u.username  AS registrado_por_usuario
        FROM predio p
        LEFT JOIN ejido e ON p.fk_ejido = e.pk_ejido
        LEFT JOIN users u ON p.registrado_por = u.pk_user
        ORDER BY p.nombre ASC`
    ),

    // ============================================
    // Listar predios inactivos (estado = 0)
    // ============================================
    listarInactivos: () => Conexion.query(
        `SELECT
            p.*,
            e.nombre    AS ejido_nombre,
            u.username  AS registrado_por_usuario
        FROM predio p
        LEFT JOIN ejido e ON p.fk_ejido = e.pk_ejido
        LEFT JOIN users u ON p.registrado_por = u.pk_user
        WHERE p.estado = 0
        ORDER BY p.nombre ASC`
    ),

    // ============================================
    // Obtener predio por ID (con detalles completos)
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            p.*,
            e.nombre    AS ejido_nombre,
            u.username  AS registrado_por_usuario
        FROM predio p
        LEFT JOIN ejido e ON p.fk_ejido = e.pk_ejido
        LEFT JOIN users u ON p.registrado_por = u.pk_user
        WHERE p.pk_predio = $1`,
        [id]
    ),

    // ============================================
    // Actualizar predio
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE predio
        SET
            nombre    = COALESCE($1, nombre),
            fk_ejido  = COALESCE($2, fk_ejido)
        WHERE pk_predio = $3
        RETURNING *`,
        [
            data.nombre,
            data.fk_ejido || null,
            id
        ]
    ),

    // ============================================
    // Desactivar predio (baja lógica, estado = 0)
    // ============================================
    desactivar: (id) => Conexion.query(
        `UPDATE predio SET estado = 0 WHERE pk_predio = $1 RETURNING *`,
        [id]
    ),

    // ============================================
    // Reactivar predio (estado = 1)
    // ============================================
    reactivar: (id) => Conexion.query(
        `UPDATE predio SET estado = 1 WHERE pk_predio = $1 RETURNING *`,
        [id]
    ),

    // ============================================
    // Verificar si el predio existe por ID
    // ============================================
    existe: (id) => Conexion.query(
        `SELECT pk_predio FROM predio WHERE pk_predio = $1`,
        [id]
    ),

    // ============================================
    // Verificar si el nombre ya existe en el mismo ejido
    // ============================================
    existeNombre: (nombre, fk_ejido, idActual = null) => Conexion.query(
        `SELECT pk_predio FROM predio
         WHERE LOWER(nombre) = LOWER($1)
           AND fk_ejido = $2
           ${idActual ? `AND pk_predio != $3` : ''}`,
        idActual ? [nombre, fk_ejido, idActual] : [nombre, fk_ejido]
    )

};