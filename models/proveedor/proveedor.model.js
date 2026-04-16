// ============================================
// MODELO: proveedor.model.js
// Descripción: Consultas SQL para proveedor
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // Crear proveedor
    crear: (data) => Conexion.query(
        `INSERT INTO proveedor
        (nombre, direccion, telefono, correo, estado, registrado_por)
        VALUES($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
            data.nombre,
            data.direccion || null,
            data.telefono || null,
            data.correo || null,
            data.estado || 1,
            data.registrado_por
        ]
    ),

    // Listar proveedores activos
    listar: () => Conexion.query(
        `SELECT
            p.*,
            u.username as registrado_por_usuario
        FROM proveedor p
        LEFT JOIN users u ON p.registrado_por = u.pk_user
        WHERE p.estado = 1
        ORDER BY p.nombre ASC`
    ),

    // Listar todos (activos e inactivos)
    listarTodos: () => Conexion.query(
        `SELECT
            p.*,
            u.username as registrado_por_usuario
        FROM proveedor p
        LEFT JOIN users u ON p.registrado_por = u.pk_user
        ORDER BY p.nombre ASC`
    ),

    // Obtener por ID
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            p.*,
            u.username as registrado_por_usuario
        FROM proveedor p
        LEFT JOIN users u ON p.registrado_por = u.pk_user
        WHERE p.pk_proveedor = $1`,
        [id]
    ),

    // Actualizar proveedor
    actualizar: (id, data) => Conexion.query(
        `UPDATE proveedor
         SET nombre=$1, direccion=$2, telefono=$3, correo=$4, estado=$5
         WHERE pk_proveedor=$6
         RETURNING *`,
        [
            data.nombre,
            data.direccion,
            data.telefono,
            data.correo,
            data.estado,
            id
        ]
    ),

    // Verificar si existe
    existe: (id) => Conexion.query(
        `SELECT pk_proveedor FROM proveedor
         WHERE pk_proveedor = $1`,
        [id]
    ),

    // Verificar si el nombre ya existe
    existePorNombre: (nombre, idActual = null) => Conexion.query(
        `SELECT pk_proveedor FROM proveedor
         WHERE nombre = $1 ${idActual ? `AND pk_proveedor != $2` : ''}`,
        idActual ? [nombre, idActual] : [nombre]
    )

};