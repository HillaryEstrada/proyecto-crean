// ============================================
// SERVICIO: alerta.service.js
// Evalúa: garantías (maquinaria/vehículo), bajo stock
//         y vencimiento de contratos de empleados
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
    try {

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
            await alertaModel.eliminarPorTipoYReferencia('garantia_por_vencer_60', r.pk_maquinaria, r.pk_vehiculo, r.pk_factura);
            await alertaModel.eliminarPorTipoYReferencia('garantia_por_vencer_30', r.pk_maquinaria, r.pk_vehiculo, r.pk_factura);
            await alertaModel.eliminarPorTipoYReferencia('garantia_vencida',       r.pk_maquinaria, r.pk_vehiculo, r.pk_factura);
        }
    }
    } catch(error) {
        console.error('[alertas] ERROR en evaluarGarantias:', error);
    }
};

// ============================================
// 2. ALERTAS DE BAJO STOCK
// Se dispara cuando stock <= stock_minimo
// Usa tipo_activo = 'consumible' (consistente con la migración v6)
// ============================================
const evaluarBajoStock = async () => {
    console.log('[alertas] Evaluando bajo stock...');

    const query = `
        SELECT
            ia.pk_articulo,
            ia.nombre,
            ia.stock,
            ia.stock_minimo,
            ue.nombre AS ubicacion_exterior,
            ui.nombre AS ubicacion_interior
        FROM inventario_articulo ia
        LEFT JOIN ubicacion ue ON ia.fk_ubicacion_exterior = ue.pk_ubicacion
        LEFT JOIN ubicacion ui ON ia.fk_ubicacion_interior = ui.pk_ubicacion
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
               AND tipo_activo = 'consumible'
               AND referencia_id NOT IN (${pkConBajoStock.map((_, i) => `$${i + 1}`).join(',')})`,
            pkConBajoStock
        );
    } else {
        await Conexion.query(
            `DELETE FROM alerta WHERE tipo_alerta = 'bajo_stock' AND tipo_activo = 'consumible'`
        );
    }

    for (const r of rows) {
        const ubicacion = r.ubicacion_interior
            ? `${r.ubicacion_exterior} / ${r.ubicacion_interior}`
            : (r.ubicacion_exterior || '');
        const ubicacionTexto = ubicacion ? ` [${ubicacion}]` : '';

        await alertaModel.insertarInventario({
            tipo_alerta:   'bajo_stock',
            categoria:     'operativa',
            prioridad:     2,
            tipo_activo:   'consumible',
            referencia_id: r.pk_articulo,
            mensaje:       `Stock bajo: "${r.nombre}"${ubicacionTexto}. Actual: ${r.stock} / Mínimo: ${r.stock_minimo}.`
        });
    }
};

// ============================================
// 3. ALERTAS DE CONTRATOS DE EMPLEADOS
// Dispara a los 60 días, 30 días y al vencer
// Solo contratos activos de empleados activos
// referencia_id = pk_contrato
// fk_empleado   = pk_empleado (columna nueva en migracion)
// ============================================
const evaluarContratosEmpleado = async () => {
    console.log('[alertas] Evaluando contratos de empleados...');

    // ── PRIMERO: generar alertas de vencidos ANTES de desactivar ──
    const { rows: vencidos } = await Conexion.query(
        `SELECT ce.pk_contrato, ce.fk_empleado, ce.fecha_fin,
                ce.numero_contrato,
                CONCAT(e.nombre,' ',e.apellido_paterno) AS nombre_empleado,
                e.numero_empleado, tc.nombre AS tipo_contrato
         FROM contrato_empleado ce
         INNER JOIN empleado e ON e.pk_empleado = ce.fk_empleado
         INNER JOIN tipo_contrato tc ON tc.pk_tipo_contrato = ce.fk_tipo_contrato
         WHERE ce.activo = true
           AND ce.fecha_fin IS NOT NULL
           AND ce.fecha_fin < CURRENT_DATE
           AND e.estado = 'activo'`
    );

    for (const r of vencidos) {
        const fechaTexto  = new Date(r.fecha_fin).toLocaleDateString('es-MX');
        const numContrato = r.numero_contrato ? ` (${r.numero_contrato})` : '';
        await alertaModel.insertar({
            tipo_alerta:   'contrato_vencido',
            categoria:     'critica',
            prioridad:     1,
            tipo_activo:   'empleado',
            fk_maquinaria: null,
            fk_vehiculo:   null,
            fk_empleado:   r.fk_empleado,
            referencia_id: r.pk_contrato,
            fecha_evento:  r.fecha_fin,
            mensaje:       `Contrato VENCIDO de ${r.nombre_empleado.trim()} [${r.numero_empleado}]${numContrato}. Venció el ${fechaTexto}. Tipo: ${r.tipo_contrato}.`
        });
    }

    // ── DESPUÉS: desactivar los vencidos ──
    await Conexion.query(
        `UPDATE contrato_empleado
        SET activo = false, estado_contrato = 'vencido'
        WHERE activo = true
        AND fecha_fin IS NOT NULL
        AND fecha_fin < CURRENT_DATE`
    );
    
    const query = `
        SELECT
            ce.pk_contrato,
            ce.fk_empleado,
            ce.fecha_fin,
            ce.numero_contrato,
            (ce.fecha_fin - CURRENT_DATE) AS dias_restantes,
            CONCAT(e.nombre, ' ', e.apellido_paterno, ' ', COALESCE(e.apellido_materno, '')) AS nombre_empleado,
            e.numero_empleado,
            tc.nombre AS tipo_contrato
        FROM contrato_empleado ce
        INNER JOIN empleado e   ON e.pk_empleado      = ce.fk_empleado
        INNER JOIN tipo_contrato tc ON tc.pk_tipo_contrato = ce.fk_tipo_contrato
        WHERE ce.activo    = true
          AND ce.fecha_fin IS NOT NULL
          AND e.estado     = 'activo'
    `;

    const { rows } = await Conexion.query(query);

    // Limpiar alertas de contratos que ya no aplican
    // (contrato renovado, empleado dado de baja, o fecha_fin NULL)
    const pkContratosActivos = rows.map(r => r.pk_contrato);
    if (pkContratosActivos.length > 0) {
        await Conexion.query(
            `DELETE FROM alerta
            WHERE tipo_activo = 'empleado'
            AND tipo_alerta IN ('contrato_por_vencer_60','contrato_por_vencer_30')
            AND referencia_id NOT IN (${pkContratosActivos.map((_, i) => `$${i + 1}`).join(',')})`,
            pkContratosActivos
        );
    } else {
        await Conexion.query(
            `DELETE FROM alerta
            WHERE tipo_activo = 'empleado'
            AND tipo_alerta IN ('contrato_por_vencer_60','contrato_por_vencer_30')`
        );
    }

    for (const r of rows) {
        const fechaTexto    = new Date(r.fecha_fin).toLocaleDateString('es-MX');
        const numContrato   = r.numero_contrato ? ` (${r.numero_contrato})` : '';
        const nombreDisplay = `${r.nombre_empleado.trim()} [${r.numero_empleado}]`;

        // Base común para este contrato
        const base = {
            tipo_activo:  'empleado',
            fk_maquinaria: null,
            fk_vehiculo:   null,
            fk_empleado:   r.fk_empleado,   // columna nueva de la migración
            referencia_id: r.pk_contrato,
            fecha_evento:  r.fecha_fin
        };

        if (r.dias_restantes <= 0) {
            // Contrato VENCIDO → eliminar preventivas y generar crítica
            await Conexion.query(
                `DELETE FROM alerta
                 WHERE tipo_activo = 'empleado'
                   AND tipo_alerta IN ('contrato_por_vencer_60','contrato_por_vencer_30')
                   AND referencia_id = $1`,
                [r.pk_contrato]
            );
            await insertarSiNoExiste({
                ...base,
                tipo_alerta: 'contrato_vencido',
                categoria:   'critica',
                prioridad:   1,
                mensaje:     `Contrato VENCIDO de ${nombreDisplay}${numContrato}. Venció el ${fechaTexto}. Tipo: ${r.tipo_contrato}.`
            });

        } else if (r.dias_restantes <= 30) {
            // Por vencer en 30 días → eliminar la de 60, generar la de 30
            await Conexion.query(
                `DELETE FROM alerta
                 WHERE tipo_activo = 'empleado'
                   AND tipo_alerta = 'contrato_por_vencer_60'
                   AND referencia_id = $1`,
                [r.pk_contrato]
            );
            await insertarSiNoExiste({
                ...base,
                tipo_alerta: 'contrato_por_vencer_30',
                categoria:   'preventiva',
                prioridad:   2,
                mensaje:     `Contrato de ${nombreDisplay}${numContrato} vence en ${r.dias_restantes} días (${fechaTexto}). Tipo: ${r.tipo_contrato}.`
            });

        } else if (r.dias_restantes <= 60) {
            // Por vencer en 60 días → alerta operativa
            await insertarSiNoExiste({
                ...base,
                tipo_alerta: 'contrato_por_vencer_60',
                categoria:   'operativa',
                prioridad:   3,
                mensaje:     `Contrato de ${nombreDisplay}${numContrato} vencerá en ${r.dias_restantes} días (${fechaTexto}). Tipo: ${r.tipo_contrato}.`
            });

        } else {
            // Más de 60 días restantes → limpiar cualquier alerta previa de este contrato
            await Conexion.query(
                `DELETE FROM alerta
                 WHERE tipo_activo = 'empleado'
                   AND tipo_alerta IN ('contrato_por_vencer_60','contrato_por_vencer_30','contrato_vencido')
                   AND referencia_id = $1`,
                [r.pk_contrato]
            );
        }
    }

    console.log(`[alertas] Contratos evaluados: ${rows.length}`);
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
        await evaluarContratosEmpleado();
        console.log('[alertas] Evaluación completada exitosamente.');
    } catch (error) {
        console.error('[alertas] Error durante la evaluación:', error.message);
        throw error;
    }
};

module.exports = {
    ejecutarTodasLasAlertas,
    evaluarGarantias,
    evaluarBajoStock,
    evaluarContratosEmpleado
};