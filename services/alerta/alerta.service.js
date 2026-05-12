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
// 4. ALERTAS DE HUMEDAD EN BODEGA
// Se dispara cuando el último muestreo tiene humedad > 14%
// tipo_activo = 'bodega', referencia_id = pk_muestreo
// ============================================
const evaluarHumedadBodega = async () => {
    console.log('[alertas] Evaluando humedad de bodega...');
    try {
        // Obtener el último muestreo por producto+bodega con humedad > 14
        const { rows: riesgos } = await Conexion.query(
            `SELECT DISTINCT ON (m.fk_bodega, m.fk_producto)
                m.pk_muestreo,
                m.fk_bodega,
                m.fk_producto,
                m.humedad,
                m.calidad,
                m.fecha_muestreo,
                b.nombre AS bodega,
                p.nombre AS producto
             FROM muestreo_bodega m
             JOIN bodega          b ON m.fk_bodega   = b.pk_bodega
             JOIN bodega_producto p ON m.fk_producto = p.pk_producto
             ORDER BY m.fk_bodega, m.fk_producto, m.fecha_muestreo DESC, m.pk_muestreo DESC`
        );

        // PKs de muestreos actuales con riesgo real
        const pksConRiesgo = riesgos
            .filter(r => parseFloat(r.humedad) > 14)
            .map(r => r.pk_muestreo);

        // Limpiar alertas de muestreos que ya no tienen riesgo
        if (pksConRiesgo.length > 0) {
            await Conexion.query(
                `DELETE FROM alerta
                 WHERE tipo_alerta = 'humedad_riesgo'
                   AND tipo_activo = 'bodega'
                   AND referencia_id NOT IN (${pksConRiesgo.map((_, i) => `$${i + 1}`).join(',')})`,
                pksConRiesgo
            );
        } else {
            await Conexion.query(
                `DELETE FROM alerta WHERE tipo_alerta = 'humedad_riesgo' AND tipo_activo = 'bodega'`
            );
        }

        // Insertar/actualizar alertas de riesgo
        for (const r of riesgos) {
            const hum = parseFloat(r.humedad);
            if (isNaN(hum) || hum <= 14) continue;

            const fechaTexto = r.fecha_muestreo
                ? new Date(r.fecha_muestreo + 'T12:00:00').toLocaleDateString('es-MX')
                : '—';

            // Borrar alerta anterior para re-insertarla actualizada
            await Conexion.query(
                `DELETE FROM alerta
                 WHERE tipo_alerta = 'humedad_riesgo'
                   AND tipo_activo = 'bodega'
                   AND referencia_id = $1`,
                [r.pk_muestreo]
            );

            await alertaModel.insertar({
                tipo_alerta:   'humedad_riesgo',
                categoria:     hum > 18 ? 'critica' : 'preventiva',
                prioridad:     hum > 18 ? 1 : 2,
                tipo_activo:   'bodega',
                fk_maquinaria: null,
                fk_vehiculo:   null,
                referencia_id: r.pk_muestreo,
                mensaje:       hum > 18
                    ? `🔴 Crítico: "${r.producto}" en ${r.bodega}. Humedad: ${hum.toFixed(1)}% — riesgo de fermentación/moho.`
                    : `⚠️ Riesgo: "${r.producto}" en ${r.bodega}. Humedad: ${hum.toFixed(1)}% — revisar pronto (muestreo ${fechaTexto}).`,
                fecha_evento:  null
            });
        }

        console.log(`[alertas] Humedad bodega evaluada: ${riesgos.length} productos revisados.`);
    } catch (error) {
        console.error('[alertas] ERROR en evaluarHumedadBodega:', error);
    }
};
// ============================================
// 5. ALERTAS DE MUESTREOS PENDIENTES
// Se dispara cuando proximo_muestreo <= CURRENT_DATE
// tipo_activo = 'bodega', referencia_id = pk_muestreo
// ============================================
const evaluarMuestreosPendientes = async () => {
    console.log('[alertas] Evaluando muestreos pendientes...');
    try {
        // Obtener el último muestreo por producto+bodega que tenga proximo_muestreo vencido
        const { rows: pendientes } = await Conexion.query(
            `SELECT DISTINCT ON (m.fk_bodega, m.fk_producto)
                m.pk_muestreo,
                m.fk_bodega,
                m.fk_producto,
                m.fecha_muestreo,
                m.proximo_muestreo,
                m.calidad,
                (CURRENT_DATE - m.proximo_muestreo) AS dias_vencido,
                b.nombre AS bodega,
                p.nombre AS producto
             FROM muestreo_bodega m
             JOIN bodega          b ON m.fk_bodega   = b.pk_bodega
             JOIN bodega_producto p ON m.fk_producto = p.pk_producto
             WHERE m.proximo_muestreo IS NOT NULL
             ORDER BY m.fk_bodega, m.fk_producto, m.fecha_muestreo DESC, m.pk_muestreo DESC`
        );

        // PKs de muestreos que SÍ están pendientes hoy
        const pksPendientes = pendientes
            .filter(r => parseInt(r.dias_vencido) >= 0)
            .map(r => r.pk_muestreo);

        // Limpiar alertas de los que ya se muestrearon (ya no aplican)
        if (pksPendientes.length > 0) {
            await Conexion.query(
                `DELETE FROM alerta
                 WHERE tipo_alerta = 'muestreo_pendiente'
                   AND tipo_activo = 'bodega'
                   AND referencia_id NOT IN (${pksPendientes.map((_, i) => `$${i + 1}`).join(',')})`,
                pksPendientes
            );
        } else {
            await Conexion.query(
                `DELETE FROM alerta WHERE tipo_alerta = 'muestreo_pendiente' AND tipo_activo = 'bodega'`
            );
        }

        // Insertar alertas de muestreos vencidos
        for (const r of pendientes) {
            const dias = parseInt(r.dias_vencido);
            if (dias < 0) continue; // aún no vence

           const proxStr = r.proximo_muestreo 
                ? new Date(r.proximo_muestreo).toISOString().slice(0, 10)
                : null;
            const proximaTexto = proxStr 
                ? new Date(proxStr + 'T12:00:00').toLocaleDateString('es-MX') 
                : '—';
            const diasTexto    = dias === 0 ? 'hoy' : `hace ${dias} día${dias !== 1 ? 's' : ''}`;

            await Conexion.query(
                `DELETE FROM alerta
                 WHERE tipo_alerta = 'muestreo_pendiente'
                   AND tipo_activo = 'bodega'
                   AND referencia_id = $1`,
                [r.pk_muestreo]
            );

            await alertaModel.insertar({
                tipo_alerta:   'muestreo_pendiente',
                categoria:     dias >= 7 ? 'critica' : 'preventiva',
                prioridad:     dias >= 7 ? 1 : 2,
                tipo_activo:   'bodega',
                fk_maquinaria: null,
                fk_vehiculo:   null,
                referencia_id: r.pk_muestreo,
                mensaje:       `Muestreo pendiente: "${r.producto}" en ${r.bodega}. Programado para ${proximaTexto} (${diasTexto}).`,
                fecha_evento:  null
            });
        }

        console.log(`[alertas] Muestreos pendientes evaluados: ${pendientes.length} productos revisados.`);
    } catch (error) {
        console.error('[alertas] ERROR en evaluarMuestreosPendientes:', error);
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
        await evaluarContratosEmpleado();
        await evaluarHumedadBodega();
        await evaluarMuestreosPendientes();
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
    evaluarContratosEmpleado,
    evaluarHumedadBodega,
    evaluarMuestreosPendientes
};