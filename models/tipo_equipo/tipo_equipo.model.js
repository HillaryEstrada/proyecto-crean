// ============================================
// MODELO: tipo_equipo.model.js
// Descripción: Consultas SQL para tipo de equipo
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Crear tipo de equipo
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO tipo_equipo 
        (nombre, registrado_por) 
        VALUES($1, $2)
        RETURNING *`,
        [
            data.nombre,
            data.registrado_por
        ]
    ),

    // ============================================
    // Listar tipos de equipo activos (estado = 1)
    // ============================================
    listar: () => Conexion.query(
        `SELECT 
            te.*,
            usr.username as registrado_por_usuario
        FROM tipo_equipo te
        LEFT JOIN users usr ON te.registrado_por = usr.pk_user
        WHERE te.estado = 1
        ORDER BY te.pk_tipo_equipo ASC`
    ),

    // ============================================
    // Obtener por ID (con detalles completos)
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT 
            te.*,
            usr.username as registrado_por_usuario
        FROM tipo_equipo te
        LEFT JOIN users usr ON te.registrado_por = usr.pk_user
        WHERE te.pk_tipo_equipo = $1`,
        [id]
    ),

    // ============================================
    // Actualizar tipo de equipo
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE tipo_equipo 
        SET 
            nombre = COALESCE($1, nombre)
        WHERE pk_tipo_equipo = $2
        RETURNING *`,
        [
            data.nombre,
            id
        ]
    ),

    // ============================================
    // Desactivar (Baja lógica, estado = 0)
    // ============================================
    desactivar: (id) => Conexion.query(
        `UPDATE tipo_equipo 
         SET estado = 0 
         WHERE pk_tipo_equipo = $1
         RETURNING *`,
        [id]
    ),

    // ============================================
    // Listar tipos de equipo inactivos (estado = 0)
    // ============================================
    listarInactivos: () => Conexion.query(
        `SELECT 
            te.*,
            usr.username as registrado_por_usuario
        FROM tipo_equipo te
        LEFT JOIN users usr ON te.registrado_por = usr.pk_user
        WHERE te.estado = 0
        ORDER BY te.pk_tipo_equipo ASC`
    ),

    // ============================================
    // Reactivar tipo de equipo (estado = 1)
    // ============================================
    reactivar: (id) => Conexion.query(
        `UPDATE tipo_equipo 
         SET estado = 1 
         WHERE pk_tipo_equipo = $1
         RETURNING *`,
        [id]
    ),

    // ============================================
    // Verificar si el nombre ya existe
    // ============================================
    existeNombre: (nombre) => Conexion.query(
        `SELECT pk_tipo_equipo FROM tipo_equipo
         WHERE LOWER(nombre) = LOWER($1)`,
        [nombre]
    )

};