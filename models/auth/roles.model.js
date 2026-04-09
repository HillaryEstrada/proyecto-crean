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

    // Obtener un rol específico por ID
    obtenerPorId: (id) => Conexion.query(
        'SELECT * FROM roles WHERE pk_rol = $1',
        [id]
    )
};