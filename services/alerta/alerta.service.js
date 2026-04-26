// ============================================
// SERVICIO: alerta.service.js
// Evalúa: garantías (maquinaria/vehículo) y bajo stock
// ============================================

const Conexion    = require('../../config/database');
const alertaModel = require('../../models/alerta/alerta.model');

// ============================================
// HELPER
// ============================================
const insertarSiNoExiste = async (data) => {
    await alertaModel.insertar(data);
};

// ============================================
// 1. ALERTAS DE GARANTÍA
// Calcula vencimiento: fecha_factura + garantia_duracion_dias
// Dispara a los 60 días, 30 días y al vencer
// ============================================
const evaluarGarantias = async () => {
    console.log('[alertas] Evaluando garantías...');

    const query = `
        SELECT
            m.pk_maquinaria,
            NULL::INT                                                   AS pk_vehiculo,
            'maquinaria'                                                AS tipo_activo,
            m.numero_economico,
            m.marca,
            m.modelo,
            f.pk_factura,
            (f.fecha_factura + f.garantia_duracion_dias)                AS fecha_vencimiento,
            (f.fecha_factura + f.garantia_duracion_dias - CURRENT_DATE) AS dias_restantes
        FROM maquinaria m
        JOIN factura f ON m.fk_factura = f.pk_factura
        WHERE f.garantia_duracion_dias IS NOT NULL
          AND m.estado_operativo != 'baja'

        UNION ALL

        SELECT
            NULL::INT                                                   AS pk_maquinaria,
            v.pk_vehiculo,
            'vehiculo'                                                  AS tipo_activo,
            v.numero_economico,
            v.marca,
            v.modelo,
            f.pk_factura,
            (f.fecha_factura + f.garantia_duracion_dias)                AS fecha_vencimiento,
            (f.fecha_factura + f.garantia_duracion_dias - CURRENT_DATE) AS dias_restantes
        FROM vehiculo v
        JOIN factura f ON v.fk_factura = f.pk_factura
        WHERE f.garantia_duracion_dias IS NOT NULL
          AND v.estado_operativo != 'baja'
    `;

    const { rows } = await Conexion.query(query);

    for (const r of rows) {
        const base = {
            tipo_activo:   r.tipo_activo,
            fk_maquinaria: r.pk_maquinaria,
            fk_vehiculo:   r.pk_vehiculo,
            referencia_id: r.pk_factura,
            fecha_evento:  r.fecha_vencimiento
        };
        const nombre     = `${r.marca} ${r.modelo} (${r.numero_economico})`;
        const fechaTexto = new Date(r.fecha_vencimiento).toLocaleDateString('es-MX');

        if (r.dias_restantes <= 0) {
            // Vencida → limpiar etapas anteriores
            await alertaModel.eliminarPorTipoYReferencia('garantia_por_vencer_30', r.pk_maquinaria, r.pk_vehiculo, r.pk_factura);
            await alertaModel.eliminarPorTipoYReferencia('garantia_por_vencer_60', r.pk_maquinaria, r.pk_vehiculo, r.pk_factura);
            await insertarSiNoExiste({
                ...base,
                tipo_alerta: 'garantia_vencida',
                categoria:   'critica',
                prioridad:   1,
                mensaje:     `Garantía VENCIDA de ${nombre}. Venció el ${fechaTexto}.`
            });

        } else if (r.dias_restantes <= 30) {
            await alertaModel.eliminarPorTipoYReferencia('garantia_por_vencer_60', r.pk_maquinaria, r.pk_vehiculo, r.pk_factura);
            await insertarSiNoExiste({
                ...base,
                tipo_alerta: 'garantia_por_vencer_30',
                categoria:   'preventiva',
                prioridad:   2,
                mensaje:     `Garantía de ${nombre} vence en ${r.dias_restantes} días (${fechaTexto}).`
            });

        } else if (r.dias_restantes <= 60) {
            await insertarSiNoExiste({
                ...base,
                tipo_alerta: 'garantia_por_vencer_60',
                categoria:   'operativa',
                prioridad:   3,
                mensaje:     `Garantía de ${nombre} vencerá en ${r.dias_restantes} días (${fechaTexto}).`
            });

        } else {
            // > 60 días → limpiar alertas obsoletas si existieran
            await alertaModel.eliminarPorTipoYReferencia('garantia_por_vencer_60', r.pk_maquinaria, r.pk_vehiculo, r.pk_factura);
            await alertaModel.eliminarPorTipoYReferencia('garantia_por_vencer_30', r.pk_maquinaria, r.pk_vehiculo, r.pk_factura);
            await alertaModel.eliminarPorTipoYReferencia('garantia_vencida',       r.pk_maquinaria, r.pk_vehiculo, r.pk_factura);
        }
    }
};

// ============================================
// 2. ALERTAS DE BAJO STOCK
// Se dispara cuando stock <= stock_minimo
// ============================================
const evaluarBajoStock = async () => {
    console.log('[alertas] Evaluando bajo stock...');

    const query = `
        SELECT
            ia.pk_articulo,
            ia.nombre,
            ia.stock,
            ia.stock_minimo,
            al.nombre AS nombre_almacen
        FROM inventario_articulo ia
        LEFT JOIN almacen al ON ia.fk_almacen = al.pk_almacen
        WHERE ia.estado = 1
          AND ia.stock_minimo IS NOT NULL
          AND ia.stock <= ia.stock_minimo
    `;

    const { rows } = await Conexion.query(query);

    // Limpiar alertas de artículos que ya recuperaron su stock
    const pkConBajoStock = rows.map(r => r.pk_articulo);
    if (pkConBajoStock.length > 0) {
        await Conexion.query(
            `DELETE FROM alerta
             WHERE tipo_alerta = 'bajo_stock'
               AND referencia_id NOT IN (${pkConBajoStock.map((_, i) => `$${i + 1}`).join(',')})`,
            pkConBajoStock
        );
    } else {
        await Conexion.query(`DELETE FROM alerta WHERE tipo_alerta = 'bajo_stock'`);
    }

    for (const r of rows) {
        const almacen = r.nombre_almacen ? ` [${r.nombre_almacen}]` : '';
        await alertaModel.insertarInventario({
            tipo_alerta:   'bajo_stock',
            categoria:     'operativa',
            prioridad:     2,
            tipo_activo:   'inventario',
            referencia_id: r.pk_articulo,
            mensaje:       `Stock bajo: "${r.nombre}"${almacen}. Actual: ${r.stock} / Mínimo: ${r.stock_minimo}.`
        });
    }
};

// ============================================
// EJECUTAR TODAS LAS EVALUACIONES
// ============================================
const ejecutarTodasLasAlertas = async () => {
    console.log('============================================');
    console.log('[alertas] Iniciando evaluación de alertas...');
    console.log('============================================');

    try {
        await evaluarGarantias();
        await evaluarBajoStock();
        console.log('[alertas] Evaluación completada exitosamente.');
    } catch (error) {
        console.error('[alertas] Error durante la evaluación:', error.message);
        throw error;
    }
};

module.exports = {
    ejecutarTodasLasAlertas,
    evaluarGarantias,
    evaluarBajoStock
};