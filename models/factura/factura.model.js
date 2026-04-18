// ============================================
// MODELO: factura.model.js
// Descripción: Consultas SQL para factura
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // Crear factura
    crear: (data) => Conexion.query(
        `INSERT INTO factura
        (numero_factura, fecha_factura, costo_adquisicion, pdf_factura, fk_proveedor, estado, registrado_por)
        VALUES($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
            data.numero_factura,
            data.fecha_factura,
            data.costo_adquisicion || null,
            data.pdf_factura || null,
            data.fk_proveedor || null,
            data.estado || 1,
            data.registrado_por
        ]
    ),

    // Listar facturas activas
    listar: () => Conexion.query(
        `SELECT
            f.*,
            p.nombre as proveedor_nombre,
            p.correo as proveedor_correo,
            p.telefono as proveedor_telefono,
            u.username as registrado_por_usuario
        FROM factura f
        LEFT JOIN proveedor p ON f.fk_proveedor = p.pk_proveedor
        LEFT JOIN users u ON f.registrado_por = u.pk_user
        WHERE f.estado = 1
        ORDER BY f.fecha_factura DESC`
    ),

    // Listar todas (activas e inactivas)
    listarTodas: () => Conexion.query(
        `SELECT
            f.*,
            p.nombre as proveedor_nombre,
            p.correo as proveedor_correo,
            p.telefono as proveedor_telefono,
            u.username as registrado_por_usuario
        FROM factura f
        LEFT JOIN proveedor p ON f.fk_proveedor = p.pk_proveedor
        LEFT JOIN users u ON f.registrado_por = u.pk_user
        ORDER BY f.fecha_factura DESC`
    ),

    // Obtener por ID
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            f.*,
            p.nombre as proveedor_nombre,
            p.correo as proveedor_correo,
            p.telefono as proveedor_telefono,
            p.direccion as proveedor_direccion,
            u.username as registrado_por_usuario
        FROM factura f
        LEFT JOIN proveedor p ON f.fk_proveedor = p.pk_proveedor
        LEFT JOIN users u ON f.registrado_por = u.pk_user
        WHERE f.pk_factura = $1`,
        [id]
    ),

    // Actualizar factura
    actualizar: (id, data) => Conexion.query(
        `UPDATE factura
        SET numero_factura=$1, fecha_factura=$2, costo_adquisicion=$3, pdf_factura=$4, fk_proveedor=$5
        WHERE pk_factura=$6
        RETURNING *`,
        [
            data.numero_factura,
            data.fecha_factura,
            data.costo_adquisicion || null,
            data.pdf_factura || null,
            data.fk_proveedor || null,
            id
        ]
    ),

    // Verificar si existe
    existe: (id) => Conexion.query(
        `SELECT pk_factura FROM factura
         WHERE pk_factura = $1`,
        [id]
    ),

    // Verificar si el número de factura ya existe
    existePorNumero: (numero, idActual = null) => Conexion.query(
        `SELECT pk_factura FROM factura
         WHERE numero_factura = $1 ${idActual ? `AND pk_factura != $2` : ''}`,
        idActual ? [numero, idActual] : [numero]
    )

};