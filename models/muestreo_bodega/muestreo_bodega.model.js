// ============================================
// MODELO: muestreo_bodega.model.js
// Descripción: Consultas SQL para muestreos de bodega
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Crear muestreo
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO muestreo_bodega
        (fk_bodega, fk_producto, fecha_muestreo, humedad, temperatura, calidad, observaciones, registrado_por)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
            data.fk_bodega,
            data.fk_producto,
            data.fecha_muestreo,
            data.humedad      || null,
            data.temperatura  || null,
            data.calidad      || null,
            data.observaciones|| null,
            data.registrado_por
        ]
    ),

    // ============================================
    // Listar todos los muestreos (con joins)
    // ============================================
    listar: () => Conexion.query(
        `SELECT
            m.*,
            b.nombre        AS bodega,
            p.nombre        AS producto,
            p.tipo_grano,
            p.variedad,
            usr.username    AS registrado_por_usuario
         FROM muestreo_bodega m
         JOIN bodega          b   ON m.fk_bodega   = b.pk_bodega
         JOIN bodega_producto p   ON m.fk_producto = p.pk_producto
         LEFT JOIN users      usr ON m.registrado_por = usr.pk_user
         ORDER BY m.fecha_muestreo DESC, m.pk_muestreo DESC`
    ),

    // ============================================
    // Listar muestreos por bodega + producto
    // (historial de un producto en una bodega específica)
    // ============================================
    listarPorBodegaProducto: (fk_bodega, fk_producto) => Conexion.query(
        `SELECT
            m.*,
            b.nombre        AS bodega,
            p.nombre        AS producto,
            p.tipo_grano,
            p.variedad,
            usr.username    AS registrado_por_usuario
         FROM muestreo_bodega m
         JOIN bodega          b   ON m.fk_bodega   = b.pk_bodega
         JOIN bodega_producto p   ON m.fk_producto = p.pk_producto
         LEFT JOIN users      usr ON m.registrado_por = usr.pk_user
         WHERE m.fk_bodega   = $1
           AND m.fk_producto = $2
         ORDER BY m.fecha_muestreo DESC, m.pk_muestreo DESC`,
        [fk_bodega, fk_producto]
    ),

    // ============================================
    // Listar muestreos por bodega (todos los productos)
    // ============================================
    listarPorBodega: (fk_bodega) => Conexion.query(
        `SELECT
            m.*,
            b.nombre        AS bodega,
            p.nombre        AS producto,
            p.tipo_grano,
            p.variedad,
            usr.username    AS registrado_por_usuario
         FROM muestreo_bodega m
         JOIN bodega          b   ON m.fk_bodega   = b.pk_bodega
         JOIN bodega_producto p   ON m.fk_producto = p.pk_producto
         LEFT JOIN users      usr ON m.registrado_por = usr.pk_user
         WHERE m.fk_bodega = $1
         ORDER BY m.fecha_muestreo DESC, m.pk_muestreo DESC`,
        [fk_bodega]
    ),

    // ============================================
    // Obtener muestreo por ID
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            m.*,
            b.nombre        AS bodega,
            p.nombre        AS producto,
            p.tipo_grano,
            p.variedad,
            usr.username    AS registrado_por_usuario
         FROM muestreo_bodega m
         JOIN bodega          b   ON m.fk_bodega   = b.pk_bodega
         JOIN bodega_producto p   ON m.fk_producto = p.pk_producto
         LEFT JOIN users      usr ON m.registrado_por = usr.pk_user
         WHERE m.pk_muestreo = $1`,
        [id]
    ),

    // ============================================
    // Actualizar muestreo
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE muestreo_bodega
         SET
             fecha_muestreo = COALESCE($1, fecha_muestreo),
             humedad        = $2,
             temperatura    = $3,
             calidad        = $4,
             observaciones  = $5
         WHERE pk_muestreo = $6
         RETURNING *`,
        [
            data.fecha_muestreo || null,
            data.humedad        ?? null,
            data.temperatura    ?? null,
            data.calidad        || null,
            data.observaciones  || null,
            id
        ]
    ),

    // ============================================
    // Eliminar muestreo
    // ============================================
    eliminar: (id) => Conexion.query(
        `DELETE FROM muestreo_bodega
         WHERE pk_muestreo = $1
         RETURNING *`,
        [id]
    )
};