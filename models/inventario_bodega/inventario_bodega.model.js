// ============================================
// MODELO: inventario_bodega.model.js
// Descripción: Consultas SQL para inventario de bodega (solo lectura)
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Obtener inventario completo con humedad,
    // calidad y último movimiento
    // ============================================
    getInventario: () => Conexion.query(
        `SELECT
            i.pk_inventario,
            i.fk_producto,
            i.fk_bodega,
            p.nombre        AS producto,
            p.tipo_grano,
            p.variedad,
            b.nombre        AS bodega,
            b.capacidad_kg,
            i.stock_kg,

            -- Humedad promedio del último detalle de este producto en esta bodega
            ult.humedad,
            ult.analisis_calidad,

            -- Último movimiento
            ult.fecha_mov,
            ult.tipo_movimiento AS ultimo_tipo

         FROM inventario_bodega i
         JOIN bodega_producto p ON i.fk_producto = p.pk_producto
         JOIN bodega b          ON i.fk_bodega   = b.pk_bodega

         -- Último movimiento por producto+bodega
         LEFT JOIN LATERAL (
             SELECT
                 d.humedad,
                 d.analisis_calidad,
                 mb.fecha       AS fecha_mov,
                 mb.tipo_movimiento
             FROM detalle_movimiento_bodega d
             JOIN movimiento_bodega mb ON d.fk_movimiento_bodega = mb.pk_movimiento_bodega
             WHERE d.fk_producto = i.fk_producto
               AND mb.fk_bodega  = i.fk_bodega
             ORDER BY mb.fecha DESC
             LIMIT 1
         ) ult ON true

         ORDER BY b.nombre ASC, p.nombre ASC`
    )

};