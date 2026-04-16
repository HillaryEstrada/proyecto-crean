// ============================================
// MODELO: tipo_equipo.model.js
// Descripción: Consultas SQL para tipos de equipo
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // Crear tipo de equipo
    crear: (data) => Conexion.query(
        `INSERT INTO tipo_equipo 
        (nombre, estado, registrado_por) 
        VALUES($1, $2, $3)
        RETURNING *`,
        [
            data.nombre,
            data.estado || 1,
            data.registrado_por
        ]
    ),

    // Listar todos los tipos de equipo activos
    listar: () => Conexion.query(
        `SELECT 
            te.*,
            u.username as registrado_por_usuario
        FROM tipo_equipo te
        LEFT JOIN users u ON te.registrado_por = u.pk_user
        WHERE te.estado = 1
        ORDER BY te.nombre ASC`
    ),

    // Listar todos (activos e inactivos)
    listarTodos: () => Conexion.query(
        `SELECT 
            te.*,
            u.username as registrado_por_usuario
        FROM tipo_equipo te
        LEFT JOIN users u ON te.registrado_por = u.pk_user
        ORDER BY te.nombre ASC`
    ),

    // Obtener por ID
    obtenerPorId: (id) => Conexion.query(
        `SELECT 
            te.*,
            u.username as registrado_por_usuario
        FROM tipo_equipo te
        LEFT JOIN users u ON te.registrado_por = u.pk_user
        WHERE te.pk_tipo_equipo = $1`,
        [id]
    ),

    // Actualizar tipo de equipo
    actualizar: (id, data) => Conexion.query(
        `UPDATE tipo_equipo 
         SET nombre=$1, estado=$2
         WHERE pk_tipo_equipo=$3
         RETURNING *`,
        [
            data.nombre,
            data.estado,
            id
        ]
    ),

    // Verificar si existe
    existe: (id) => Conexion.query(
        `SELECT pk_tipo_equipo FROM tipo_equipo 
         WHERE pk_tipo_equipo = $1`,
        [id]
    ),

    // Verificar si el nombre ya existe
    existePorNombre: (nombre, idActual = null) => Conexion.query(
        `SELECT pk_tipo_equipo FROM tipo_equipo 
         WHERE nombre = $1 ${idActual ? `AND pk_tipo_equipo != $2` : ''}`,
        idActual ? [nombre, idActual] : [nombre]
    )

};