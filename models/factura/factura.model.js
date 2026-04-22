// ============================================
// MODELO: factura.model.js
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    crear: (data) => Conexion.query(
        `INSERT INTO factura
        (numero_factura, fecha_factura, costo_adquisicion, pdf_factura, fk_proveedor,
         tipo_activo, modelo_referencia,
         garantia_duracion_dias, garantia_limite_horas, garantia_limite_km,
         estado, registrado_por)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING *`,
        [
            data.numero_factura,
            data.fecha_factura,
            data.costo_adquisicion   || null,
            data.pdf_factura         || null,
            data.fk_proveedor        || null,
            data.tipo_activo,
            data.modelo_referencia   || null,
            data.garantia_duracion_dias  || null,
            data.garantia_limite_horas   || null,
            data.garantia_limite_km      || null,
            data.estado || 1,
            data.registrado_por
        ]
    ),

    listar: () => Conexion.query(
        `SELECT f.*, p.nombre as proveedor_nombre,
                p.correo as proveedor_correo, p.telefono as proveedor_telefono,
                u.username as registrado_por_usuario
         FROM factura f
         LEFT JOIN proveedor p ON f.fk_proveedor = p.pk_proveedor
         LEFT JOIN users u ON f.registrado_por = u.pk_user
         WHERE f.estado = 1
         ORDER BY f.fecha_factura DESC`
    ),

    listarTodas: () => Conexion.query(
        `SELECT f.*, p.nombre as proveedor_nombre,
                p.correo as proveedor_correo, p.telefono as proveedor_telefono,
                u.username as registrado_por_usuario
         FROM factura f
         LEFT JOIN proveedor p ON f.fk_proveedor = p.pk_proveedor
         LEFT JOIN users u ON f.registrado_por = u.pk_user
         ORDER BY f.fecha_factura DESC`
    ),

    obtenerPorId: (id) => Conexion.query(
        `SELECT f.*, p.nombre as proveedor_nombre,
                p.correo as proveedor_correo, p.telefono as proveedor_telefono,
                p.direccion as proveedor_direccion,
                u.username as registrado_por_usuario
         FROM factura f
         LEFT JOIN proveedor p ON f.fk_proveedor = p.pk_proveedor
         LEFT JOIN users u ON f.registrado_por = u.pk_user
         WHERE f.pk_factura = $1`,
        [id]
    ),

    actualizar: (id, data) => Conexion.query(
        `UPDATE factura
         SET numero_factura=$1, fecha_factura=$2, costo_adquisicion=$3,
             pdf_factura=$4, fk_proveedor=$5,
             tipo_activo=$6, modelo_referencia=$7,
             garantia_duracion_dias=$8, garantia_limite_horas=$9, garantia_limite_km=$10
         WHERE pk_factura=$11
         RETURNING *`,
        [
            data.numero_factura,
            data.fecha_factura,
            data.costo_adquisicion       || null,
            data.pdf_factura             || null,
            data.fk_proveedor            || null,
            data.tipo_activo,
            data.modelo_referencia       || null,
            data.garantia_duracion_dias  || null,
            data.garantia_limite_horas   || null,
            data.garantia_limite_km      || null,
            id
        ]
    ),

    existe: (id) => Conexion.query(
        `SELECT pk_factura FROM factura WHERE pk_factura = $1`, [id]
    ),

    existePorNumero: (numero, idActual = null) => Conexion.query(
        `SELECT pk_factura FROM factura
         WHERE numero_factura = $1 ${idActual ? 'AND pk_factura != $2' : ''}`,
        idActual ? [numero, idActual] : [numero]
    )
};