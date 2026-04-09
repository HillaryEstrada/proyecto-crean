// ============================================
// MODELO: users.model.js
// Descripción: CRUD completo de usuarios
// ============================================

const Conexion = require('../../config/database');

module.exports = {
    // Crear usuario nuevo
    crear: (data) => Conexion.query(
        `INSERT INTO users(username, email, password_hash, nombre_completo, fk_rol) 
         VALUES($1, $2, $3, $4, $5) RETURNING pk_user`,
        [data.username, data.email, data.password_hash, data.nombre_completo, data.fk_rol]
    ),

    // Listar todos los usuarios activos con su rol
    listar: () => Conexion.query(
        `SELECT u.pk_user, u.username, u.email, u.nombre_completo, 
                u.fk_rol, r.nombre as rol_nombre, u.estado, 
                u.ultimo_acceso, u.fecha_creacion
         FROM users u 
         INNER JOIN roles r ON u.fk_rol = r.pk_rol 
         WHERE u.estado = 1 
         ORDER BY u.pk_user ASC`
    ),

    // Obtener usuario por ID
    obtenerPorId: (id) => Conexion.query(
        `SELECT u.pk_user, u.username, u.email, u.nombre_completo, 
                u.fk_rol, r.nombre as rol_nombre, u.estado
         FROM users u 
         INNER JOIN roles r ON u.fk_rol = r.pk_rol 
         WHERE u.pk_user = $1`,
        [id]
    ),

    // Actualizar datos del usuario (sin contraseña)
    actualizar: (id, data) => Conexion.query(
        `UPDATE users 
         SET username=$1, email=$2, nombre_completo=$3, fk_rol=$4, 
             fecha_actualizacion=CURRENT_TIMESTAMP 
         WHERE pk_user=$5`,
        [data.username, data.email, data.nombre_completo, data.fk_rol, id]
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

    // Eliminar usuario permanentemente (hard delete)
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
    },

    // Verificar si un email ya existe
    existeEmail: (email, excludeId = null) => {
        const query = excludeId 
            ? 'SELECT pk_user FROM users WHERE email=$1 AND pk_user != $2'
            : 'SELECT pk_user FROM users WHERE email=$1';
        const params = excludeId ? [email, excludeId] : [email];
        return Conexion.query(query, params);
    }
};