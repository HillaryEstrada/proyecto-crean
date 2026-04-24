// ============================================
// MODELO: ejido.model.js
// Descripción: Consultas SQL para ejido
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Crear ejido
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO ejido
        (nombre, municipio, estado, direccion, registrado_por)
        VALUES($1, $2, $3, $4, $5)
        RETURNING *`,
        [
            data.nombre,
            data.municipio || null,
            data.estado    || null,
            data.direccion || null,
            data.registrado_por
        ]
    ),

    // ============================================
    // Listar ejidos activos (activo = 1)
    // ============================================
    listar: () => Conexion.query(
        `SELECT
            e.*,
            u.username AS registrado_por_usuario
        FROM ejido e
        LEFT JOIN users u ON e.registrado_por = u.pk_user
        WHERE e.activo = 1
        ORDER BY e.nombre ASC`
    ),

    // ============================================
    // Listar todos los ejidos (activos e inactivos)
    // ============================================
    listarTodos: () => Conexion.query(
        `SELECT
            e.*,
            u.username AS registrado_por_usuario
        FROM ejido e
        LEFT JOIN users u ON e.registrado_por = u.pk_user
        ORDER BY e.nombre ASC`
    ),

    // ============================================
    // Listar ejidos inactivos (activo = 0)
    // ============================================
    listarInactivos: () => Conexion.query(
        `SELECT
            e.*,
            u.username AS registrado_por_usuario
        FROM ejido e
        LEFT JOIN users u ON e.registrado_por = u.pk_user
        WHERE e.activo = 0
        ORDER BY e.nombre ASC`
    ),

    // ============================================
    // Obtener ejido por ID (con detalles completos)
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            e.*,
            u.username AS registrado_por_usuario
        FROM ejido e
        LEFT JOIN users u ON e.registrado_por = u.pk_user
        WHERE e.pk_ejido = $1`,
        [id]
    ),

    // ============================================
    // Actualizar ejido
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE ejido
        SET
            nombre    = COALESCE($1, nombre),
            municipio = COALESCE($2, municipio),
            estado    = COALESCE($3, estado),
            direccion = COALESCE($4, direccion)
        WHERE pk_ejido = $5
        RETURNING *`,
        [
            data.nombre,
            data.municipio || null,
            data.estado    || null,
            data.direccion || null,
            id
        ]
    ),

    // ============================================
    // Desactivar ejido (baja lógica, activo = 0)
    // ============================================
    desactivar: (id) => Conexion.query(
        `UPDATE ejido SET activo = 0 WHERE pk_ejido = $1 RETURNING *`,
        [id]
    ),

    // ============================================
    // Reactivar ejido (activo = 1)
    // ============================================
    reactivar: (id) => Conexion.query(
        `UPDATE ejido SET activo = 1 WHERE pk_ejido = $1 RETURNING *`,
        [id]
    ),

    // ============================================
    // Verificar si el ejido existe por ID
    // ============================================
    existe: (id) => Conexion.query(
        `SELECT pk_ejido FROM ejido WHERE pk_ejido = $1`,
        [id]
    ),

    // ============================================
    // Verificar si el nombre ya existe (evitar duplicados)
    // ============================================
    existeNombre: (nombre, idActual = null) => Conexion.query(
        `SELECT pk_ejido FROM ejido
         WHERE LOWER(nombre) = LOWER($1) ${idActual ? `AND pk_ejido != $2` : ''}`,
        idActual ? [nombre, idActual] : [nombre]
    )

};