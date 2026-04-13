// ============================================
// MODELO: empleado.model.js
// Descripción: Operaciones con la tabla empleado
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // Listar todos los empleados con todos sus datos
    listar: () => Conexion.query(
        `SELECT pk_empleado, numero_empleado, nombre, apellido_paterno, apellido_materno,
                sexo, telefono, correo, direccion, estado, fecha_ingreso,
                CONCAT(nombre, ' ', apellido_paterno, ' ', apellido_materno) as nombre_completo
         FROM empleado
         ORDER BY nombre ASC`
    ),

    // Obtener empleado por ID
    obtenerPorId: (id) => Conexion.query(
        `SELECT pk_empleado, numero_empleado, nombre, apellido_paterno, apellido_materno,
                sexo, telefono, correo, direccion, estado, fecha_ingreso,
                CONCAT(nombre, ' ', apellido_paterno, ' ', apellido_materno) as nombre_completo
         FROM empleado
         WHERE pk_empleado = $1`,
        [id]
    ),

    // Crear empleado nuevo
    crear: (data) => Conexion.query(
        `INSERT INTO empleado(numero_empleado, nombre, apellido_paterno, apellido_materno,
                              sexo, telefono, correo, direccion, estado, fecha_ingreso)
         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING pk_empleado`,
        [
            data.numero_empleado,
            data.nombre,
            data.apellido_paterno,
            data.apellido_materno,
            data.sexo,
            data.telefono,
            data.correo,
            data.direccion,
            data.estado || 'activo',
            data.fecha_ingreso
        ]
    ),

    // Actualizar empleado
    actualizar: (id, data) => Conexion.query(
        `UPDATE empleado
         SET numero_empleado=$1, nombre=$2, apellido_paterno=$3, apellido_materno=$4,
             sexo=$5, telefono=$6, correo=$7, direccion=$8, estado=$9, fecha_ingreso=$10
         WHERE pk_empleado=$11`,
        [
            data.numero_empleado,
            data.nombre,
            data.apellido_paterno,
            data.apellido_materno,
            data.sexo,
            data.telefono,
            data.correo,
            data.direccion,
            data.estado,
            data.fecha_ingreso,
            id
        ]
    ),

    // Desactivar empleado (soft delete)
    desactivar: (id) => Conexion.query(
        `UPDATE empleado SET estado='inactivo', fecha_baja=CURRENT_DATE WHERE pk_empleado=$1`,
        [id]
    ),

    // Verificar si numero_empleado ya existe
    existeNumero: (numero, excludeId = null) => {
        const query = excludeId
            ? 'SELECT pk_empleado FROM empleado WHERE numero_empleado=$1 AND pk_empleado != $2'
            : 'SELECT pk_empleado FROM empleado WHERE numero_empleado=$1';
        const params = excludeId ? [numero, excludeId] : [numero];
        return Conexion.query(query, params);
    },

    // Verificar si correo ya existe
    existeCorreo: (correo, excludeId = null) => {
        const query = excludeId
            ? 'SELECT pk_empleado FROM empleado WHERE correo=$1 AND pk_empleado != $2'
            : 'SELECT pk_empleado FROM empleado WHERE correo=$1';
        const params = excludeId ? [correo, excludeId] : [correo];
        return Conexion.query(query, params);
    }
};