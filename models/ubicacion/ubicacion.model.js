// ============================================
// MODELO: ubicacion.model.js
// Descripción: Consultas SQL para ubicación
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // Crear ubicación
    crear: (data) => Conexion.query(
        `INSERT INTO ubicacion
        (nombre, descripcion, registrado_por)
        VALUES($1, $2, $3)
        RETURNING *`,
        [
            data.nombre,
            data.descripcion || null,
            data.registrado_por
        ]
    ),

    // Listar ubicaciones activas
    listar: () => Conexion.query(
        `SELECT
            u.*,
            us.username as registrado_por_usuario
        FROM ubicacion u
        LEFT JOIN users us ON u.registrado_por = us.pk_user
        WHERE u.estado = 1
        ORDER BY u.nombre ASC`
    ),

    // Listar todas (activas e inactivas)
    listarTodas: () => Conexion.query(
        `SELECT
            u.*,
            us.username as registrado_por_usuario
        FROM ubicacion u
        LEFT JOIN users us ON u.registrado_por = us.pk_user
        ORDER BY u.nombre ASC`
    ),

    // Obtener por ID
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            u.*,
            us.username as registrado_por_usuario
        FROM ubicacion u
        LEFT JOIN users us ON u.registrado_por = us.pk_user
        WHERE u.pk_ubicacion = $1`,
        [id]
    ),

    // Actualizar ubicación
    actualizar: (id, data) => Conexion.query(
        `UPDATE ubicacion
        SET nombre=$1, descripcion=$2
        WHERE pk_ubicacion=$3
        RETURNING *`,
        [
            data.nombre,
            data.descripcion || null,
            id
        ]
    ),

    // Verificar si existe
    existe: (id) => Conexion.query(
        `SELECT pk_ubicacion FROM ubicacion
         WHERE pk_ubicacion = $1`,
        [id]
    ),

    // Verificar si el nombre ya existe
    existePorNombre: (nombre, idActual = null) => Conexion.query(
        `SELECT pk_ubicacion FROM ubicacion
         WHERE nombre = $1 ${idActual ? `AND pk_ubicacion != $2` : ''}`,
        idActual ? [nombre, idActual] : [nombre]
    )

};