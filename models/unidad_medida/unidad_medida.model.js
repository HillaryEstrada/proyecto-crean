// ============================================
// MODELO: unidad_medida.model.js
// Descripción: Consultas SQL para unidad de medida
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Crear unidad de medida
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO unidad_medida
        (nombre, registrado_por)
        VALUES($1, $2)
        RETURNING *`,
        [
            data.nombre,
            data.registrado_por
        ]
    ),

    // ============================================
    // Listar unidades activas (estado = 1)
    // ============================================
    listar: () => Conexion.query(
        `SELECT
            um.*,
            u.username AS registrado_por_usuario
        FROM unidad_medida um
        LEFT JOIN users u ON um.registrado_por = u.pk_user
        WHERE um.estado = 1
        ORDER BY um.nombre ASC`
    ),

    // ============================================
    // Listar todas las unidades (activas e inactivas)
    // ============================================
    listarTodos: () => Conexion.query(
        `SELECT
            um.*,
            u.username AS registrado_por_usuario
        FROM unidad_medida um
        LEFT JOIN users u ON um.registrado_por = u.pk_user
        ORDER BY um.nombre ASC`
    ),

    // ============================================
    // Listar unidades inactivas (estado = 0)
    // ============================================
    listarInactivos: () => Conexion.query(
        `SELECT
            um.*,
            u.username AS registrado_por_usuario
        FROM unidad_medida um
        LEFT JOIN users u ON um.registrado_por = u.pk_user
        WHERE um.estado = 0
        ORDER BY um.nombre ASC`
    ),

    // ============================================
    // Obtener unidad por ID
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            um.*,
            u.username AS registrado_por_usuario
        FROM unidad_medida um
        LEFT JOIN users u ON um.registrado_por = u.pk_user
        WHERE um.pk_unidad = $1`,
        [id]
    ),

    // ============================================
    // Actualizar unidad de medida
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE unidad_medida
        SET nombre = COALESCE($1, nombre)
        WHERE pk_unidad = $2
        RETURNING *`,
        [
            data.nombre,
            id
        ]
    ),

    // ============================================
    // Desactivar unidad (baja lógica, estado = 0)
    // ============================================
    desactivar: (id) => Conexion.query(
        `UPDATE unidad_medida SET estado = 0 WHERE pk_unidad = $1 RETURNING *`,
        [id]
    ),

    // ============================================
    // Reactivar unidad (estado = 1)
    // ============================================
    reactivar: (id) => Conexion.query(
        `UPDATE unidad_medida SET estado = 1 WHERE pk_unidad = $1 RETURNING *`,
        [id]
    ),

    // ============================================
    // Verificar si el nombre ya existe (evitar duplicados)
    // ============================================
    existeNombre: (nombre, idActual = null) => Conexion.query(
        `SELECT pk_unidad FROM unidad_medida
         WHERE LOWER(nombre) = LOWER($1) ${idActual ? `AND pk_unidad != $2` : ''}`,
        idActual ? [nombre, idActual] : [nombre]
    )

};