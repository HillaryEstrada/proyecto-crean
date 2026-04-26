// ============================================
// MODELO: area.model.js
// Descripción: Consultas SQL para area
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Crear area
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO area
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
    // Listar areas activas (estado = 1)
    // ============================================
    listar: () => Conexion.query(
        `SELECT
            a.*,
            u.username AS registrado_por_usuario
        FROM area a
        LEFT JOIN users u ON a.registrado_por = u.pk_user
        WHERE a.estado = 1
        ORDER BY a.nombre ASC`
    ),

    // ============================================
    // Listar todas las areas (activas e inactivas)
    // ============================================
    listarTodos: () => Conexion.query(
        `SELECT
            a.*,
            u.username AS registrado_por_usuario
        FROM area a
        LEFT JOIN users u ON a.registrado_por = u.pk_user
        ORDER BY a.nombre ASC`
    ),

    // ============================================
    // Listar areas inactivas (estado = 0)
    // ============================================
    listarInactivos: () => Conexion.query(
        `SELECT
            a.*,
            u.username AS registrado_por_usuario
        FROM area a
        LEFT JOIN users u ON a.registrado_por = u.pk_user
        WHERE a.estado = 0
        ORDER BY a.nombre ASC`
    ),

    // ============================================
    // Obtener area por ID
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            a.*,
            u.username AS registrado_por_usuario
        FROM area a
        LEFT JOIN users u ON a.registrado_por = u.pk_user
        WHERE a.pk_area = $1`,
        [id]
    ),

    // ============================================
    // Actualizar area
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE area
        SET
            nombre      = COALESCE($1, nombre),
            descripcion = $2
        WHERE pk_area = $3
        RETURNING *`,
        [
            data.nombre,
            data.descripcion || null,
            id
        ]
    ),
    // ============================================
    // Desactivar area (baja lógica, estado = 0)
    // ============================================
    desactivar: (id) => Conexion.query(
        `UPDATE area SET estado = 0 WHERE pk_area = $1 RETURNING *`,
        [id]
    ),

    // ============================================
    // Reactivar area (estado = 1)
    // ============================================
    reactivar: (id) => Conexion.query(
        `UPDATE area SET estado = 1 WHERE pk_area = $1 RETURNING *`,
        [id]
    ),

    // ============================================
    // Verificar si el nombre ya existe (evitar duplicados)
    // ============================================
    existeNombre: (nombre, idActual = null) => Conexion.query(
        `SELECT pk_area FROM area
         WHERE LOWER(nombre) = LOWER($1) ${idActual ? `AND pk_area != $2` : ''}`,
        idActual ? [nombre, idActual] : [nombre]
    )

};