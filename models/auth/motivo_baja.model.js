// ============================================
// MODELO: motivo_baja.model.js
// Descripción: Operaciones con la tabla motivo_baja
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // Listar todos los motivos de baja
    listar: () => Conexion.query(
        `SELECT pk_motivo_baja, nombre
         FROM motivo_baja
         ORDER BY nombre ASC`
    ),

    // Obtener motivo por ID
    obtenerPorId: (id) => Conexion.query(
        `SELECT pk_motivo_baja, nombre
         FROM motivo_baja
         WHERE pk_motivo_baja = $1`,
        [id]
    ),

    // Crear motivo de baja
    crear: (nombre) => Conexion.query(
        `INSERT INTO motivo_baja (nombre)
         VALUES ($1)
         RETURNING pk_motivo_baja`,
        [nombre]
    ),

    // Actualizar motivo de baja
    actualizar: (id, nombre) => Conexion.query(
        `UPDATE motivo_baja
         SET nombre = $1
         WHERE pk_motivo_baja = $2`,
        [nombre, id]
    ),

    // Eliminar motivo de baja (solo si no está en uso)
    eliminar: (id) => Conexion.query(
        `DELETE FROM motivo_baja
         WHERE pk_motivo_baja = $1`,
        [id]
    ),

    // Verificar si nombre ya existe
    existeNombre: (nombre, excludeId = null) => {
        const query = excludeId
            ? 'SELECT pk_motivo_baja FROM motivo_baja WHERE LOWER(nombre) = LOWER($1) AND pk_motivo_baja != $2'
            : 'SELECT pk_motivo_baja FROM motivo_baja WHERE LOWER(nombre) = LOWER($1)';
        const params = excludeId ? [nombre, excludeId] : [nombre];
        return Conexion.query(query, params);
    },

    // Verificar si está en uso en algún empleado
    estaEnUso: (id) => Conexion.query(
        `SELECT pk_empleado FROM empleado
         WHERE fk_motivo_baja = $1 LIMIT 1`,
        [id]
    ),
};