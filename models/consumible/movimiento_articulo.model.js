// ============================================
// MODELO: movimiento_articulo.model.js
// ============================================

const Conexion = require('../../config/database');

// ============================================
// Registrar movimiento (dentro de transacción)
// ============================================
exports.registrar = async (client, datos) => {
    const {
        fk_articulo, tipo_movimiento, cantidad, motivo,
        registrado_por, entregado_por, recibido_por, fk_area, referencia
    } = datos;

    return client.query(
        `INSERT INTO movimiento_articulo
            (fk_articulo, tipo_movimiento, cantidad, motivo,
             registrado_por, entregado_por, recibido_por, fk_area, referencia)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
            fk_articulo, tipo_movimiento, cantidad, motivo,
            registrado_por || null, entregado_por || null,
            recibido_por   || null, fk_area       || null,
            referencia     || null
        ]
    );
};

// ============================================
// Historial por artículo
// ============================================
exports.historialPorArticulo = async (fk_articulo) => {
    return Conexion.query(
        `SELECT
            ma.pk_movimiento_articulo,
            ma.tipo_movimiento,
            ma.cantidad,
            ma.motivo,
            ma.referencia,
            ma.fecha,
            ia.nombre           AS articulo,
            ar.nombre           AS area,
            u_reg.username      AS registrado_por,
            u_ent.username      AS entregado_por,
            CASE WHEN e.pk_empleado IS NOT NULL 
        THEN CONCAT(e.nombre, ' ', e.apellido_paterno) 
        ELSE NULL END AS recibido_por
         FROM movimiento_articulo ma
         INNER JOIN inventario_articulo ia ON ia.pk_articulo = ma.fk_articulo
         LEFT JOIN  area              ar  ON ar.pk_area      = ma.fk_area
         LEFT JOIN  users         u_reg   ON u_reg.pk_user   = ma.registrado_por
         LEFT JOIN  users         u_ent   ON u_ent.pk_user   = ma.entregado_por
         LEFT JOIN  empleado      e       ON e.pk_empleado   = ma.recibido_por
         WHERE ma.fk_articulo = $1
         ORDER BY ma.fecha DESC`,
        [fk_articulo]
    );
};

// ============================================
// Historial general (todos los movimientos)
// ============================================
exports.historialGeneral = async ({ tipo, fecha_inicio, fecha_fin } = {}) => {
    let conditions = [];
    const params   = [];

    if (tipo) {
        params.push(tipo);
        conditions.push(`ma.tipo_movimiento = $${params.length}`);
    }
    if (fecha_inicio) {
        params.push(fecha_inicio);
        conditions.push(`ma.fecha >= $${params.length}`);
    }
    if (fecha_fin) {
        params.push(fecha_fin);
        conditions.push(`ma.fecha <= $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    return Conexion.query(
        `SELECT
            ma.pk_movimiento_articulo,
            ma.tipo_movimiento,
            ma.cantidad,
            ma.motivo,
            ma.referencia,
            ma.fecha,
            ia.nombre           AS articulo,
            ia.categoria        AS categoria,
            ar.nombre           AS area,
            u_reg.username      AS registrado_por,
            u_ent.username      AS entregado_por,
            CASE WHEN e.pk_empleado IS NOT NULL 
            THEN CONCAT(e.nombre, ' ', e.apellido_paterno) 
            ELSE NULL END AS recibido_por
         FROM movimiento_articulo ma
         INNER JOIN inventario_articulo ia ON ia.pk_articulo = ma.fk_articulo
         LEFT JOIN  area              ar  ON ar.pk_area      = ma.fk_area
         LEFT JOIN  users         u_reg   ON u_reg.pk_user   = ma.registrado_por
         LEFT JOIN  users         u_ent   ON u_ent.pk_user   = ma.entregado_por
         LEFT JOIN  empleado      e       ON e.pk_empleado   = ma.recibido_por
         ${where}
         ORDER BY ma.fecha DESC`,
        params
    );
};