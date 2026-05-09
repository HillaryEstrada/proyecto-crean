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
        registrado_por, entregado_por, recibido_por,
        fk_area, referencia,
        numero_factura, fecha_factura, folio_memorandum, folio_vale,
        autorizado_por, fecha_autorizacion,
        archivo_factura, archivo_acta, tipo_baja
    } = datos;

    return client.query(
        `INSERT INTO movimiento_articulo
            (fk_articulo, tipo_movimiento, cantidad, motivo,
             registrado_por, entregado_por, recibido_por, fk_area, referencia,
             numero_factura, fecha_factura, folio_memorandum, folio_vale,
             autorizado_por, fecha_autorizacion,
             archivo_factura, archivo_acta, tipo_baja)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         RETURNING *`,
        [
            fk_articulo, tipo_movimiento, cantidad, motivo,
            registrado_por    || null,
            entregado_por     || null,
            recibido_por      || null,
            fk_area           || null,
            referencia        || null,
            numero_factura    || null,
            fecha_factura     || null,
            folio_memorandum  || null,
            folio_vale        || null,
            autorizado_por    || null,
            fecha_autorizacion || null,
            archivo_factura   || null,
            archivo_acta      || null,
            tipo_baja        || null
        ]
    );
};

// ============================================
// Generar folio de vale (solo para salidas)
// ============================================
exports.generarFolioVale = async (client) => {
    const result = await client.query(
        `SELECT public.generar_folio_vale() AS folio`
    );
    return result.rows[0].folio;
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
            ma.numero_factura,
            ma.folio_memorandum,
            ma.folio_vale,
            ma.fecha,
            ma.fecha_autorizacion,
            ma.tipo_baja,
            ia.nombre                                        AS articulo,
            ar.nombre                                        AS area,
            u_reg.username                                   AS registrado_por,
            CONCAT(e_aut.nombre,' ',e_aut.apellido_paterno)  AS autorizado_por,
            CASE WHEN e_rec.pk_empleado IS NOT NULL
                THEN CONCAT(e_rec.nombre,' ',e_rec.apellido_paterno)
                ELSE NULL
            END                                              AS recibido_por
         FROM movimiento_articulo ma
         INNER JOIN inventario_articulo ia   ON ia.pk_articulo   = ma.fk_articulo
         LEFT JOIN  area             ar      ON ar.pk_area        = ma.fk_area
         LEFT JOIN  users            u_reg   ON u_reg.pk_user     = ma.registrado_por
         LEFT JOIN  empleado         e_aut   ON e_aut.pk_empleado = ma.autorizado_por
         LEFT JOIN  empleado         e_rec   ON e_rec.pk_empleado = ma.recibido_por
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
            ma.numero_factura,
            ma.folio_memorandum,
            ma.folio_vale,
            ma.fecha_factura,
            ma.archivo_factura,
            ma.archivo_acta,
            ma.tipo_baja,
            ma.fecha,
            ma.fecha_autorizacion,
            ia.nombre                                        AS articulo,
            ar.nombre                                        AS area,
            u_reg.username                                   AS registrado_por,
            ma.fecha                                         AS fecha_registro,
            CONCAT(e_aut.nombre,' ',e_aut.apellido_paterno)  AS autorizado_por,
            CASE WHEN e_rec.pk_empleado IS NOT NULL
                THEN CONCAT(e_rec.nombre,' ',e_rec.apellido_paterno)
                ELSE NULL
            END                                              AS recibido_por
         FROM movimiento_articulo ma
         INNER JOIN inventario_articulo ia   ON ia.pk_articulo   = ma.fk_articulo
         LEFT JOIN  area             ar      ON ar.pk_area        = ma.fk_area
         LEFT JOIN  users            u_reg   ON u_reg.pk_user     = ma.registrado_por
         LEFT JOIN  empleado         e_aut   ON e_aut.pk_empleado = ma.autorizado_por
         LEFT JOIN  empleado         e_rec   ON e_rec.pk_empleado = ma.recibido_por
         ${where}
         ORDER BY ma.fecha DESC`,
        params
    );
};

exports.historialPorEmpleado = async (fk_empleado, { anio, fk_area } = {}) => {
    const params = [fk_empleado];
    const conditions = [
        `ma.recibido_por = $1`,
        `ma.tipo_movimiento = 'salida'`,
        `ma.folio_vale IS NOT NULL`
    ];

    if (anio) {
        params.push(anio);
        conditions.push(`EXTRACT(YEAR FROM ma.fecha) = $${params.length}`);
    }
    if (fk_area) {
        params.push(fk_area);
        conditions.push(`ma.fk_area = $${params.length}`);
    }

    return Conexion.query(
        `SELECT
            ma.folio_vale, ma.fecha, ma.cantidad, ma.motivo, ma.folio_memorandum, ma.tipo_baja,
            ia.nombre AS articulo,
            ar.nombre AS area,
            CONCAT(e_aut.nombre,' ',e_aut.apellido_paterno) AS autorizado_por
         FROM movimiento_articulo ma
         INNER JOIN inventario_articulo ia  ON ia.pk_articulo   = ma.fk_articulo
         LEFT JOIN  area             ar     ON ar.pk_area        = ma.fk_area
         LEFT JOIN  empleado         e_aut  ON e_aut.pk_empleado = ma.autorizado_por
         WHERE ${conditions.join(' AND ')}
         ORDER BY ma.fecha DESC`,
        params
    );
};