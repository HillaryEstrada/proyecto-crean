// ============================================
// MODELO: users.model.js
// Descripción: CRUD completo de usuarios
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // Crear usuario nuevo
    crear: (data) => Conexion.query(
        `INSERT INTO users(username, password_hash, fk_rol, fk_empleado) 
         VALUES($1, $2, $3, $4) RETURNING pk_user`,
        [data.username, data.password_hash, data.fk_rol, data.fk_empleado]
    ),

    // Listar todos los usuarios activos con su rol y nombre del empleado
    listar: () => Conexion.query(
        `SELECT u.pk_user, u.username, u.fk_rol, u.fk_empleado,
                u.estado, u.ultimo_acceso, u.fecha_creacion,
                r.nombre as rol_nombre,
                CONCAT(e.nombre, ' ', e.apellido_paterno, ' ', e.apellido_materno) as nombre_completo
         FROM users u 
         INNER JOIN roles r ON u.fk_rol = r.pk_rol
         INNER JOIN empleado e ON u.fk_empleado = e.pk_empleado 
         ORDER BY u.pk_user ASC`
    ),

    // Obtener usuario por ID
    obtenerPorId: (id) => Conexion.query(
        `SELECT u.pk_user, u.username, u.fk_rol, u.fk_empleado,
                u.estado, u.ultimo_acceso,
                r.nombre as rol_nombre,
                CONCAT(e.nombre, ' ', e.apellido_paterno, ' ', e.apellido_materno) as nombre_completo
         FROM users u 
         INNER JOIN roles r ON u.fk_rol = r.pk_rol
         INNER JOIN empleado e ON u.fk_empleado = e.pk_empleado
         WHERE u.pk_user = $1`,
        [id]
    ),

    // Actualizar datos del usuario (sin contraseña)
    actualizar: (id, data) => Conexion.query(
        `UPDATE users 
         SET username=$1, fk_rol=$2, fk_empleado=$3,
             fecha_actualizacion=CURRENT_TIMESTAMP 
         WHERE pk_user=$4`,
        [data.username, data.fk_rol, data.fk_empleado, id]
    ),

    // Actualizar solo la contraseña
    actualizarPassword: (id, passwordHash) => Conexion.query(
        `UPDATE users 
         SET password_hash=$1, fecha_actualizacion=CURRENT_TIMESTAMP 
         WHERE pk_user=$2`,
        [passwordHash, id]
    ),

    // Desactivar usuario (soft delete)
    desactivar: (id) => Conexion.query(
        'UPDATE users SET estado=0, fecha_actualizacion=CURRENT_TIMESTAMP WHERE pk_user=$1',
        [id]
    ),

    // Eliminar usuario permanentemente
    desaparecer: (id) => Conexion.query(
        'DELETE FROM users WHERE pk_user=$1',
        [id]
    ),

    // Verificar si un username ya existe
    existeUsername: (username, excludeId = null) => {
        const query = excludeId
            ? 'SELECT pk_user FROM users WHERE username=$1 AND pk_user != $2'
            : 'SELECT pk_user FROM users WHERE username=$1';
        const params = excludeId ? [username, excludeId] : [username];
        return Conexion.query(query, params);
    }
};