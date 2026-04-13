// ============================================
// MODELO: modulos.model.js
// Descripción: Operaciones con módulos y rol_modulos
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // Listar todos los módulos activos
    listar: () => Conexion.query(
        'SELECT * FROM modulos WHERE estado = 1 ORDER BY orden ASC'
    ),

    // Obtener las CLAVES de módulos que tiene un rol
    obtenerClavesPorRol: (fk_rol) => Conexion.query(
        `SELECT m.clave
         FROM modulos m
         INNER JOIN rol_modulos rm ON m.pk_modulo = rm.fk_modulo
         WHERE rm.fk_rol = $1 AND m.estado = 1
         ORDER BY m.orden ASC`,
        [fk_rol]
    ),

    // Obtener módulos completos de un rol (para la UI de gestión)
    obtenerPorRol: (fk_rol) => Conexion.query(
        `SELECT m.*, 
                CASE WHEN rm.fk_modulo IS NOT NULL THEN true ELSE false END as asignado
         FROM modulos m
         LEFT JOIN rol_modulos rm 
            ON m.pk_modulo = rm.fk_modulo AND rm.fk_rol = $1
         WHERE m.estado = 1
         ORDER BY m.orden ASC`,
        [fk_rol]
    ),

    // Asignar módulos a un rol (reemplaza todo lo que tenía)
    asignarArol: async (fk_rol, arrayDeIds) => {
        await Conexion.query(
            'DELETE FROM rol_modulos WHERE fk_rol = $1',
            [fk_rol]
        );
        if (!arrayDeIds || arrayDeIds.length === 0) return;

        const values = arrayDeIds.map((id, i) => `($1, $${i + 2})`).join(', ');
        return Conexion.query(
            `INSERT INTO rol_modulos (fk_rol, fk_modulo) VALUES ${values}`,
            [fk_rol, ...arrayDeIds]
        );
    },  // ← coma aquí

    // Obtener excepciones individuales de un usuario
    obtenerExcepcionesPorUser: (fk_user) => Conexion.query(
        `SELECT um.tipo, m.clave
         FROM user_modulos um
         INNER JOIN modulos m ON m.pk_modulo = um.fk_modulo
         WHERE um.fk_user = $1 AND m.estado = 1`,
        [fk_user]
    ),

    // Obtener todos los módulos con estado para un usuario
    obtenerPorUser: (fk_user, fk_rol) => Conexion.query(
        `SELECT m.*,
                CASE 
                    WHEN um.tipo = 'quitar' THEN false
                    WHEN um.tipo = 'agregar' THEN true
                    WHEN rm.fk_modulo IS NOT NULL THEN true
                    ELSE false
                END as asignado,
                um.tipo as excepcion
         FROM modulos m
         LEFT JOIN rol_modulos rm 
            ON m.pk_modulo = rm.fk_modulo AND rm.fk_rol = $2
         LEFT JOIN user_modulos um 
            ON m.pk_modulo = um.fk_modulo AND um.fk_user = $1
         WHERE m.estado = 1
         ORDER BY m.orden ASC`,
        [fk_user, fk_rol]
    ),

    // Guardar excepciones individuales de un usuario
    guardarExcepcionesUser: async (fk_user, agregar, quitar) => {
        await Conexion.query(
            'DELETE FROM user_modulos WHERE fk_user = $1',
            [fk_user]
        );

        for (const fk_modulo of agregar) {
            await Conexion.query(
                `INSERT INTO user_modulos (fk_user, fk_modulo, tipo) 
                 VALUES ($1, $2, 'agregar')`,
                [fk_user, fk_modulo]
            );
        }

        for (const fk_modulo of quitar) {
            await Conexion.query(
                `INSERT INTO user_modulos (fk_user, fk_modulo, tipo) 
                 VALUES ($1, $2, 'quitar')`,
                [fk_user, fk_modulo]
            );
        }
    }
};