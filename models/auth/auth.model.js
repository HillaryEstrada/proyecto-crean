// ============================================
// MODELO: auth.model.js
// Descripción: Operaciones de base de datos para autenticación
// ============================================

const Conexion = require('../../config/database');

module.exports = {
    // Buscar usuario por username o email
    buscarPorCredencial: (credencial) => Conexion.query(
        `SELECT u.*, r.nombre as rol_nombre 
         FROM users u 
         INNER JOIN roles r ON u.fk_rol = r.pk_rol 
         INNER JOIN empleado e ON u.fk_empleado = e.pk_empleado
         WHERE (u.username = $1 OR e.correo = $1) AND u.estado = 1`,
        [credencial]
    ),

    // Buscar usuario por ID
    buscarPorId: (id) => Conexion.query(
        `SELECT u.pk_user, u.username, e.correo, e.nombre, 
                u.fk_rol, r.nombre as rol_nombre, u.estado, u.ultimo_acceso
         FROM users u 
         INNER JOIN roles r ON u.fk_rol = r.pk_rol 
         INNER JOIN empleado e ON u.fk_empleado = e.pk_empleado
         WHERE u.pk_user = $1`,
        [id]
    ),

    // Actualizar último acceso del usuario
    actualizarUltimoAcceso: (id) => Conexion.query(
        'UPDATE users SET ultimo_acceso = CURRENT_TIMESTAMP WHERE pk_user = $1',
        [id]
    ),

    // Guardar sesión en la base de datos
    guardarSesion: (data) => Conexion.query(
        `INSERT INTO sesiones(fk_user, token, ip_address, user_agent, fecha_expiracion) 
         VALUES($1, $2, $3, $4, $5) RETURNING pk_sesion`,
        [data.userId, data.token, data.ip, data.userAgent, data.expiracion]
    ),

    // Cerrar sesión (marcar como inactiva)
    cerrarSesion: (token) => Conexion.query(
        'UPDATE sesiones SET activa = FALSE WHERE token = $1',
        [token]
    ),

    // Limpiar sesiones expiradas (opcional, para mantenimiento)
    limpiarSesionesExpiradas: () => Conexion.query(
        'DELETE FROM sesiones WHERE fecha_expiracion < CURRENT_TIMESTAMP AND activa = FALSE'
    )
};