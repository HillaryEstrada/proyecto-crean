// ============================================
// MODELO: tipo_contrato.model.js
// Descripción: Operaciones con la tabla tipo_contrato
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // Listar todos los tipos de contrato
    listar: () => Conexion.query(
        `SELECT pk_tipo_contrato, nombre
         FROM tipo_contrato
         ORDER BY nombre ASC`
    ),

    // Obtener tipo de contrato por ID
    obtenerPorId: (id) => Conexion.query(
        `SELECT pk_tipo_contrato, nombre
         FROM tipo_contrato
         WHERE pk_tipo_contrato = $1`,
        [id]
    ),

    // Crear tipo de contrato
    crear: (nombre) => Conexion.query(
        `INSERT INTO tipo_contrato (nombre)
         VALUES ($1)
         RETURNING pk_tipo_contrato`,
        [nombre]
    ),

    // Actualizar tipo de contrato
    actualizar: (id, nombre) => Conexion.query(
        `UPDATE tipo_contrato
         SET nombre = $1
         WHERE pk_tipo_contrato = $2`,
        [nombre, id]
    ),

    // Eliminar tipo de contrato (solo si no tiene contratos asociados)
    eliminar: (id) => Conexion.query(
        `DELETE FROM tipo_contrato
         WHERE pk_tipo_contrato = $1`,
        [id]
    ),

    // Verificar si nombre ya existe
    existeNombre: (nombre, excludeId = null) => {
        const query = excludeId
            ? 'SELECT pk_tipo_contrato FROM tipo_contrato WHERE LOWER(nombre) = LOWER($1) AND pk_tipo_contrato != $2'
            : 'SELECT pk_tipo_contrato FROM tipo_contrato WHERE LOWER(nombre) = LOWER($1)';
        const params = excludeId ? [nombre, excludeId] : [nombre];
        return Conexion.query(query, params);
    },

    // Verificar si tiene contratos asociados
    tieneContratos: (id) => Conexion.query(
        `SELECT pk_contrato FROM contrato_empleado
         WHERE fk_tipo_contrato = $1 LIMIT 1`,
        [id]
    ),
};