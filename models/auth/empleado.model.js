// ============================================
// MODELO: empleado.model.js
// Descripción: Operaciones con la tabla empleado
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // Listar todos los empleados activos con info de cuenta
    listar: () => Conexion.query(
    `SELECT DISTINCT ON (e.pk_empleado)
            e.pk_empleado, e.numero_empleado, e.nombre, e.apellido_paterno, 
            e.apellido_materno, e.sexo, e.telefono, e.correo, e.direccion, 
            e.estado, e.fecha_ingreso, e.fecha_nacimiento, e.foto_perfil,
            CONCAT(e.nombre, ' ', e.apellido_paterno, ' ', e.apellido_materno) as nombre_completo,
            u.pk_user, u.username, u.estado as estado_user
    FROM empleado e
    LEFT JOIN users u ON u.fk_empleado = e.pk_empleado
    WHERE (e.estado = 'activo' OR e.estado IS NULL)
    ORDER BY e.pk_empleado, u.estado DESC NULLS LAST`
),

    // Obtener empleado por ID con info de cuenta
    obtenerPorId: (id) => Conexion.query(
        `SELECT e.pk_empleado, e.numero_empleado, e.nombre, e.apellido_paterno,
                e.apellido_materno, e.sexo, e.telefono, e.correo, e.direccion,
                e.estado, e.fecha_ingreso, e.fecha_nacimiento, e.foto_perfil,
                CONCAT(e.nombre, ' ', e.apellido_paterno, ' ', e.apellido_materno) as nombre_completo,
                u.pk_user, u.username, u.estado as estado_user
         FROM empleado e
         LEFT JOIN users u ON u.fk_empleado = e.pk_empleado
         WHERE e.pk_empleado = $1`,
        [id]
    ),

    // Crear empleado nuevo
    crear: (data) => Conexion.query(
        `INSERT INTO empleado(numero_empleado, nombre, apellido_paterno, apellido_materno,
                              sexo, telefono, correo, direccion, estado, fecha_ingreso, fecha_nacimiento)
         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
            data.fecha_ingreso,
            data.fecha_nacimiento
        ]
    ),

    // Actualizar empleado
    actualizar: (id, data) => Conexion.query(
        `UPDATE empleado
         SET numero_empleado=$1, nombre=$2, apellido_paterno=$3, apellido_materno=$4,
             sexo=$5, telefono=$6, correo=$7, direccion=$8, estado=$9, 
             fecha_ingreso=$10, fecha_nacimiento=$11
         WHERE pk_empleado=$12`,
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
            data.fecha_nacimiento,
            id
        ]
    ),

    // Actualizar solo la foto de perfil
    actualizarFoto: (id, url) => Conexion.query(
        'UPDATE empleado SET foto_perfil=$1 WHERE pk_empleado=$2',
        [url, id]
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
    },

    listarBajas: () => Conexion.query(
    `SELECT pk_empleado, numero_empleado, nombre, apellido_paterno,
            apellido_materno, telefono, correo, estado
     FROM empleado WHERE estado != 'activo' ORDER BY nombre ASC`
    ),
};