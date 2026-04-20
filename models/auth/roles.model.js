// ============================================
// MODELO: roles.model.js
// Descripción: Operaciones con roles del sistema
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // Listar todos los roles activos
    listar: () => Conexion.query(
        'SELECT * FROM roles WHERE estado = 1 ORDER BY pk_rol ASC'
    ),

    // Listar todos los roles (activos e inactivos)
    listarTodos: () => Conexion.query(
        'SELECT * FROM roles ORDER BY pk_rol ASC'
    ),

    // Obtener un rol específico por ID
    obtenerPorId: (id) => Conexion.query(
        'SELECT * FROM roles WHERE pk_rol = $1',
        [id]
    ),

    // Crear rol
    crear: (data) => Conexion.query(
        `INSERT INTO roles (nombre, descripcion, estado)
         VALUES($1, $2, 1) RETURNING *`,
        [data.nombre, data.descripcion || null]
    ),

    // Actualizar rol
    actualizar: (id, data) => Conexion.query(
        `UPDATE roles SET nombre=$1, descripcion=$2
         WHERE pk_rol=$3 RETURNING *`,
        [data.nombre, data.descripcion || null, id]
    ),

    // Desactivar rol
    desactivar: (id) => Conexion.query(
        `UPDATE roles SET estado=0 WHERE pk_rol=$1 RETURNING *`,
        [id]
    ),

    // Activar rol
    activar: (id) => Conexion.query(
        `UPDATE roles SET estado=1 WHERE pk_rol=$1 RETURNING *`,
        [id]
    )
};