// ============================================
// RUTAS: /dashboard/*  — Dashboard CREAN
// Archivo: routes/dashboard/dashboard.routes.js
// ============================================

const express    = require('express');
const router     = express.Router();
const Conexion   = require('../../config/database');
const { verificarToken } = require('../../middleware/auth.middleware');

// ── Proteger todas las rutas del dashboard ──
router.use(verificarToken);

// ── helper ──────────────────────────────────
async function q(sql, params = []) {
    const { rows } = await Conexion.query(sql, params);
    return rows;
}

// ============================================
// GET /dashboard/alertas
// ============================================
router.get('/alertas', async (req, res) => {
    try {
        const rows = await q(`
            SELECT pk_alerta, tipo_alerta, categoria, prioridad,
                   tipo_activo, mensaje, fecha_evento, fecha_generada
            FROM alerta
            WHERE leida = false
            ORDER BY prioridad ASC, fecha_generada DESC
            LIMIT 10
        `);
        res.json(rows);
    } catch (e) {
        console.error('dashboard/alertas:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// GET /dashboard/kpis
// ============================================
router.get('/kpis', async (req, res) => {
    try {
        const [[maq], [veh], [bodStock], [bodOp], [emp], [ct]] = await Promise.all([
            q(`SELECT
                COUNT(*) FILTER (WHERE estado_operativo <> 'baja') AS total,
                COUNT(*) FILTER (WHERE estado_operativo = 'disponible') AS disponible,
                COUNT(*) FILTER (WHERE estado_operativo IN ('prestada','mantenimiento')) AS uso
               FROM maquinaria`),

            q(`SELECT
                COUNT(*) FILTER (WHERE estado_operativo <> 'baja') AS total,
                COUNT(*) FILTER (WHERE estado_operativo = 'disponible') AS disponible,
                COUNT(*) FILTER (WHERE estado_operativo = 'prestada') AS uso
               FROM vehiculo`),

            q(`SELECT COALESCE(SUM(stock_kg) / 1000, 0)::numeric(10,2) AS stock_ton FROM inventario_bodega`),

            q(`SELECT COUNT(*) FILTER (WHERE estado = 'Operativo') AS operativas FROM bodega`),

            q(`SELECT COUNT(*) AS activos FROM empleado WHERE estado = 'activo'`),

            q(`SELECT COUNT(*) AS por_vencer
               FROM contrato_empleado
               WHERE activo = true
                 AND fecha_fin IS NOT NULL
                 AND fecha_fin <= CURRENT_DATE + INTERVAL '60 days'`),
        ]);

        res.json({
            maquinaria_total:      Number(maq.total),
            maquinaria_disponible: Number(maq.disponible),
            maquinaria_uso:        Number(maq.uso),
            vehiculo_total:        Number(veh.total),
            vehiculo_disponible:   Number(veh.disponible),
            vehiculo_uso:          Number(veh.uso),
            bodega_stock_ton:      Number(bodStock.stock_ton),
            bodegas_operativas:    Number(bodOp.operativas),
            empleados_activos:     Number(emp.activos),
            contratos_por_vencer:  Number(ct.por_vencer),
        });
    } catch (e) {
        console.error('dashboard/kpis:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// GET /dashboard/actividad
// ============================================
router.get('/actividad', async (req, res) => {
    try {
        const rows = await q(`
            SELECT * FROM (
                SELECT
                    ma.pk_movimiento_articulo AS id,
                    ma.tipo_movimiento AS tipo,
                    CASE ma.tipo_movimiento
                        WHEN 'entrada' THEN 'Entrada consumible'
                        WHEN 'salida'  THEN 'Salida consumible'
                        WHEN 'baja'    THEN 'Baja artículo'
                    END AS tipo_label,
                    ia.nombre || ' · ' ||
                        CASE ma.tipo_movimiento WHEN 'entrada' THEN '+' ELSE '-' END ||
                        ma.cantidad::text || ' ' ||
                        COALESCE(um.nombre, 'pz') AS descripcion,
                    TO_CHAR(ma.fecha, 'DD/MM/YYYY HH24:MI') AS fecha_fmt,
                    COALESCE(e.nombre || ' ' || e.apellido_paterno, '') AS responsable,
                    COALESCE(ma.folio_vale, ma.numero_factura, '') AS referencia,
                    ma.fecha AS orden
                FROM movimiento_articulo ma
                JOIN inventario_articulo ia ON ia.pk_articulo = ma.fk_articulo
                LEFT JOIN unidad_medida  um ON um.pk_unidad   = ia.fk_unidad
                LEFT JOIN empleado       e  ON e.pk_empleado  = ma.recibido_por

                UNION ALL

                SELECT
                    mb.pk_movimiento_bodega AS id,
                    mb.tipo_movimiento || '_bodega' AS tipo,
                    CASE mb.tipo_movimiento
                        WHEN 'entrada' THEN 'Entrada bodega'
                        WHEN 'salida'  THEN 'Salida bodega'
                    END AS tipo_label,
                    b.nombre || ' — ' ||
                        COALESCE(
                            (SELECT SUM(dbd.cantidad_kg)::text
                             FROM detalle_movimiento_bodega dbd
                             WHERE dbd.fk_movimiento_bodega = mb.pk_movimiento_bodega),
                            '0'
                        ) || ' kg' AS descripcion,
                    TO_CHAR(mb.fecha, 'DD/MM/YYYY HH24:MI') AS fecha_fmt,
                    '' AS responsable,
                    COALESCE(mb.motivo, '') AS referencia,
                    mb.fecha AS orden
                FROM movimiento_bodega mb
                JOIN bodega b ON b.pk_bodega = mb.fk_bodega
            ) combined
            ORDER BY orden DESC
            LIMIT 8
        `);
        res.json(rows);
    } catch (e) {
        console.error('dashboard/actividad:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// GET /dashboard/estado-operativo
// ============================================
router.get('/estado-operativo', async (req, res) => {
    try {
        const [activos, mob] = await Promise.all([
            q(`SELECT
                COUNT(*) FILTER (WHERE estado_operativo = 'disponible')                  AS disponible,
                COUNT(*) FILTER (WHERE estado_operativo IN ('prestada','mantenimiento')) AS en_uso,
                COUNT(*) FILTER (WHERE estado_operativo = 'mantenimiento')               AS mantenimiento,
                COUNT(*) FILTER (WHERE estado_operativo = 'baja')                        AS baja
               FROM (
                   SELECT estado_operativo FROM maquinaria
                   UNION ALL
                   SELECT estado_operativo FROM vehiculo
               ) t`),
            q(`SELECT
                COUNT(*)                                                AS mob_total,
                COUNT(*) FILTER (WHERE estado_operativo = 'disponible') AS mob_disponible,
                COUNT(*) FILTER (WHERE estado_operativo = 'prestado')   AS mob_prestado,
                COUNT(*) FILTER (WHERE estado_operativo = 'baja')       AS mob_baja
               FROM mobiliario`),
        ]);

        res.json({
            disponible:     Number(activos[0].disponible),
            en_uso:         Number(activos[0].en_uso),
            mantenimiento:  Number(activos[0].mantenimiento),
            baja:           Number(activos[0].baja),
            mob_total:      Number(mob[0].mob_total),
            mob_disponible: Number(mob[0].mob_disponible),
            mob_prestado:   Number(mob[0].mob_prestado),
            mob_baja:       Number(mob[0].mob_baja),
        });
    } catch (e) {
        console.error('dashboard/estado-operativo:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// GET /dashboard/stock-bajo
// ============================================
router.get('/stock-bajo', async (req, res) => {
    try {
        const rows = await q(`
            SELECT ia.pk_articulo, ia.nombre, ia.stock, ia.stock_minimo,
                   COALESCE(um.nombre, '') AS unidad
            FROM inventario_articulo ia
            LEFT JOIN unidad_medida um ON um.pk_unidad = ia.fk_unidad
            WHERE ia.estado = 1
              AND ia.stock <= ia.stock_minimo
            ORDER BY (ia.stock_minimo - ia.stock) DESC
            LIMIT 8
        `);
        res.json(rows);
    } catch (e) {
        console.error('dashboard/stock-bajo:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// GET /dashboard/bodegas
// ============================================
router.get('/bodegas', async (req, res) => {
    try {
        const rows = await q(`
            SELECT b.pk_bodega, b.nombre, b.estado, b.capacidad_ton,
                   COALESCE(SUM(ib.stock_kg) / 1000, 0)::numeric(10,2) AS stock_ton
            FROM bodega b
            LEFT JOIN inventario_bodega ib ON ib.fk_bodega = b.pk_bodega
            GROUP BY b.pk_bodega, b.nombre, b.estado, b.capacidad_ton
            ORDER BY b.nombre
        `);
        res.json(rows);
    } catch (e) {
        console.error('dashboard/bodegas:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// GET /dashboard/contratos-alerta
// ============================================
router.get('/contratos-alerta', async (req, res) => {
    try {
        const rows = await q(`
            SELECT ce.pk_contrato, e.nombre, e.apellido_paterno AS apellido,
                   ce.fecha_fin, ce.estado_contrato,
                   (ce.fecha_fin - CURRENT_DATE) AS dias_restantes
            FROM contrato_empleado ce
            JOIN empleado e ON e.pk_empleado = ce.fk_empleado
            WHERE ce.activo = true
              AND ce.fecha_fin IS NOT NULL
              AND ce.fecha_fin <= CURRENT_DATE + INTERVAL '60 days'
            ORDER BY ce.fecha_fin ASC
            LIMIT 6
        `);
        res.json(rows);
    } catch (e) {
        console.error('dashboard/contratos-alerta:', e.message);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;