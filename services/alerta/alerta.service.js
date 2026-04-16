// ============================================
// SERVICIO: alerta.service.js
// Descripción: Lógica de evaluación y generación de alertas
// ============================================

const Conexion = require('../../config/database');
const alertaModel = require('../../models/alerta/alerta.model');

// ============================================
// HELPERS
// ============================================

/**
 * Inserta un registro en evento_activo cuando ocurre un evento crítico.
 * Ignora silenciosamente si ya existe.
 */
const registrarEvento = async (tipo_activo, fk_maquinaria, fk_vehiculo, tipo_evento, descripcion, referencia_id) => {
    try {
        await Conexion.query(
            `INSERT INTO evento_activo
            (tipo_activo, fk_maquinaria, fk_vehiculo, tipo_evento, descripcion, fk_referencia)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [tipo_activo, fk_maquinaria || null, fk_vehiculo || null, tipo_evento, descripcion, referencia_id || null]
        );
    } catch (err) {
        console.warn('[evento_activo] No se pudo registrar evento:', err.message);
    }
};

/**
 * CORRECCIÓN #2/#3: Insertar alerta solo si no existe una igual HOY.
 * Para alertas con referencia_id (garantía, mantenimiento, falla) usa ON CONFLICT.
 * Para alertas sin referencia_id (checklist, inactividad) verifica existeHoy() antes.
 */
const insertarSiNoExiste = async (data) => {
    // Alertas diarias sin referencia_id → verificar por fecha para evitar spam
    if (data.referencia_id === null || data.referencia_id === undefined) {
        const existe = await alertaModel.existeHoy(
            data.tipo_alerta,
            data.fk_maquinaria || null,
            data.fk_vehiculo   || null
        );
        if (existe.rows.length > 0) return; // ya existe hoy, no duplicar
    }

    await alertaModel.insertar(data);
};

// ============================================
// 1. ALERTAS DE GARANTÍA
// ============================================
const evaluarGarantias = async () => {
    console.log('[alertas] Evaluando garantías...');

    const query = `
        SELECT
            m.pk_maquinaria,
            NULL::INT AS pk_vehiculo,
            'maquinaria' AS tipo_activo,
            m.numero_economico,
            m.marca,
            m.modelo,
            g.pk_garantia,
            g.fecha_fin,
            (g.fecha_fin - CURRENT_DATE) AS dias_restantes
        FROM maquinaria m
        JOIN garantia g ON m.fk_garantia = g.pk_garantia
        WHERE g.fecha_fin IS NOT NULL
          AND m.estado_operativo != 'baja'

        UNION ALL

        SELECT
            NULL::INT AS pk_maquinaria,
            v.pk_vehiculo,
            'vehiculo' AS tipo_activo,
            v.numero_economico,
            v.marca,
            v.modelo,
            g.pk_garantia,
            g.fecha_fin,
            (g.fecha_fin - CURRENT_DATE) AS dias_restantes
        FROM vehiculo v
        JOIN garantia g ON v.fk_garantia = g.pk_garantia
        WHERE g.fecha_fin IS NOT NULL
          AND v.estado_operativo != 'baja'
    `;

    const { rows } = await Conexion.query(query);

    for (const r of rows) {
        const base = {
            tipo_activo: r.tipo_activo,
            fk_maquinaria: r.pk_maquinaria,
            fk_vehiculo: r.pk_vehiculo,
            referencia_id: r.pk_garantia,
            fecha_evento: r.fecha_fin
        };
        const nombre = `${r.marca} ${r.modelo} (${r.numero_economico})`;

        // CORRECCIÓN #4: Limpiar alertas de etapas anteriores cuando avanza la condición.
        // Si la garantía ya venció, eliminar la alerta "por vencer" que ya no aplica.
        if (r.dias_restantes <= 0) {
            await alertaModel.eliminarResuelta('garantia_por_vencer_30', r.pk_maquinaria, r.pk_vehiculo, r.pk_garantia);
            await alertaModel.eliminarResuelta('garantia_por_vencer_60', r.pk_maquinaria, r.pk_vehiculo, r.pk_garantia);

            await insertarSiNoExiste({
                ...base,
                tipo_alerta: 'garantia_vencida',
                categoria: 'critica',
                prioridad: 1,
                mensaje: `Garantía VENCIDA de ${nombre}. Venció el ${r.fecha_fin}.`
            });
            await registrarEvento(r.tipo_activo, r.pk_maquinaria, r.pk_vehiculo, 'cambio_estado',
                `Garantía vencida el ${r.fecha_fin}`, r.pk_garantia);

        } else if (r.dias_restantes <= 30) {
            // Limpiar alerta de 60 días si ya pasamos a la de 30
            await alertaModel.eliminarResuelta('garantia_por_vencer_60', r.pk_maquinaria, r.pk_vehiculo, r.pk_garantia);

            await insertarSiNoExiste({
                ...base,
                tipo_alerta: 'garantia_por_vencer_30',
                categoria: 'preventiva',
                prioridad: 2,
                mensaje: `Garantía de ${nombre} vence en ${r.dias_restantes} días (${r.fecha_fin}).`
            });

        } else if (r.dias_restantes <= 60) {
            await insertarSiNoExiste({
                ...base,
                tipo_alerta: 'garantia_por_vencer_60',
                categoria: 'operativa',
                prioridad: 3,
                mensaje: `Garantía de ${nombre} vencerá en ${r.dias_restantes} días (${r.fecha_fin}).`
            });

        } else {
            // CORRECCIÓN #4: Garantía está vigente con >60 días → eliminar alertas obsoletas
            await alertaModel.eliminarResuelta('garantia_por_vencer_60', r.pk_maquinaria, r.pk_vehiculo, r.pk_garantia);
            await alertaModel.eliminarResuelta('garantia_por_vencer_30', r.pk_maquinaria, r.pk_vehiculo, r.pk_garantia);
            await alertaModel.eliminarResuelta('garantia_vencida',       r.pk_maquinaria, r.pk_vehiculo, r.pk_garantia);
        }
    }
};

// ============================================
// 2. ALERTAS DE MANTENIMIENTO POR FECHA
// ============================================
const evaluarMantenimientoPorFecha = async () => {
    console.log('[alertas] Evaluando mantenimiento por fecha...');

    // Obtener el mantenimiento más reciente finalizado con fecha próxima por activo
    const query = `
        SELECT DISTINCT ON (mt.fk_maquinaria, mt.fk_vehiculo)
            mt.pk_mantenimiento,
            mt.tipo_activo,
            mt.fk_maquinaria,
            mt.fk_vehiculo,
            mt.proximo_mantenimiento_fecha,
            (mt.proximo_mantenimiento_fecha - CURRENT_DATE) AS dias_restantes,
            COALESCE(m.numero_economico, v.numero_economico) AS numero_economico,
            COALESCE(m.marca, v.marca)   AS marca,
            COALESCE(m.modelo, v.modelo) AS modelo
        FROM mantenimiento mt
        LEFT JOIN maquinaria m ON mt.fk_maquinaria = m.pk_maquinaria
        LEFT JOIN vehiculo   v ON mt.fk_vehiculo   = v.pk_vehiculo
        WHERE mt.proximo_mantenimiento_fecha IS NOT NULL
          AND mt.estado_mantenimiento = 'finalizado'
        ORDER BY mt.fk_maquinaria, mt.fk_vehiculo, mt.proximo_mantenimiento_fecha DESC
    `;

    const { rows } = await Conexion.query(query);

    // CORRECCIÓN #4: Obtener todos los pk_mantenimiento activos para limpiar alertas
    // de mantenimientos que ya no son los más recientes
    const pkActivos = rows.map(r => r.pk_mantenimiento);

    if (pkActivos.length > 0) {
        await Conexion.query(
            `DELETE FROM alerta
             WHERE tipo_alerta IN ('mantenimiento_por_fecha_vencido', 'mantenimiento_por_fecha_proximo')
               AND referencia_id NOT IN (${pkActivos.map((_, i) => `$${i + 1}`).join(',')})`,
            pkActivos
        );
    }

    for (const r of rows) {
        const base = {
            tipo_activo: r.tipo_activo,
            fk_maquinaria: r.fk_maquinaria,
            fk_vehiculo: r.fk_vehiculo,
            referencia_id: r.pk_mantenimiento,
            fecha_evento: r.proximo_mantenimiento_fecha
        };
        const nombre = `${r.marca} ${r.modelo} (${r.numero_economico})`;

        if (r.dias_restantes <= 0) {
            // Limpiar alerta de "próximo" cuando ya venció
            await alertaModel.eliminarResuelta('mantenimiento_por_fecha_proximo', r.fk_maquinaria, r.fk_vehiculo, r.pk_mantenimiento);

            await insertarSiNoExiste({
                ...base,
                tipo_alerta: 'mantenimiento_por_fecha_vencido',
                categoria: 'critica',
                prioridad: 1,
                mensaje: `Mantenimiento VENCIDO de ${nombre}. Debió realizarse el ${r.proximo_mantenimiento_fecha}.`
            });
            await registrarEvento(r.tipo_activo, r.fk_maquinaria, r.fk_vehiculo, 'mantenimiento',
                `Mantenimiento vencido desde ${r.proximo_mantenimiento_fecha}`, r.pk_mantenimiento);

        } else if (r.dias_restantes <= 7) {
            await insertarSiNoExiste({
                ...base,
                tipo_alerta: 'mantenimiento_por_fecha_proximo',
                categoria: 'preventiva',
                prioridad: 2,
                mensaje: `Mantenimiento de ${nombre} se requiere en ${r.dias_restantes} días (${r.proximo_mantenimiento_fecha}).`
            });

        } else {
            // CORRECCIÓN #4: Mantenimiento tiene más de 7 días → limpiar alertas obsoletas
            await alertaModel.eliminarResuelta('mantenimiento_por_fecha_proximo', r.fk_maquinaria, r.fk_vehiculo, r.pk_mantenimiento);
            await alertaModel.eliminarResuelta('mantenimiento_por_fecha_vencido', r.fk_maquinaria, r.fk_vehiculo, r.pk_mantenimiento);
        }
    }
};

// ============================================
// 3. ALERTAS DE MANTENIMIENTO POR HORAS
// ============================================
const evaluarMantenimientoPorHoras = async () => {
    console.log('[alertas] Evaluando mantenimiento por horas...');

    const query = `
        SELECT DISTINCT ON (mt.fk_maquinaria)
            mt.pk_mantenimiento,
            mt.fk_maquinaria,
            mt.proximo_mantenimiento_horas,
            m.horas_actuales,
            m.numero_economico,
            m.marca,
            m.modelo,
            CASE
                WHEN mt.proximo_mantenimiento_horas > 0
                THEN ROUND((m.horas_actuales::DECIMAL / mt.proximo_mantenimiento_horas) * 100)
                ELSE 0
            END AS porcentaje_uso
        FROM mantenimiento mt
        JOIN maquinaria m ON mt.fk_maquinaria = m.pk_maquinaria
        WHERE mt.proximo_mantenimiento_horas IS NOT NULL
          AND mt.tipo_activo = 'maquinaria'
          AND mt.estado_mantenimiento = 'finalizado'
          AND m.estado_operativo != 'baja'
        ORDER BY mt.fk_maquinaria, mt.proximo_mantenimiento_horas DESC
    `;

    const { rows } = await Conexion.query(query);

    for (const r of rows) {
        const base = {
            tipo_activo: 'maquinaria',
            fk_maquinaria: r.fk_maquinaria,
            fk_vehiculo: null,
            referencia_id: r.pk_mantenimiento,
            fecha_evento: null
        };
        const nombre = `${r.marca} ${r.modelo} (${r.numero_economico})`;

        if (r.porcentaje_uso >= 100) {
            // CORRECCIÓN #4: Limpiar alerta del 80% cuando ya llegó al 100%
            await alertaModel.eliminarResuelta('mantenimiento_por_horas_80', r.fk_maquinaria, null, r.pk_mantenimiento);

            await insertarSiNoExiste({
                ...base,
                tipo_alerta: 'mantenimiento_por_horas_100',
                categoria: 'critica',
                prioridad: 1,
                mensaje: `Mantenimiento REQUERIDO en ${nombre}. Horas actuales: ${r.horas_actuales} / Límite: ${r.proximo_mantenimiento_horas} (${r.porcentaje_uso}%).`
            });

        } else if (r.porcentaje_uso >= 80) {
            await insertarSiNoExiste({
                ...base,
                tipo_alerta: 'mantenimiento_por_horas_80',
                categoria: 'preventiva',
                prioridad: 2,
                mensaje: `Mantenimiento próximo en ${nombre}. Horas actuales: ${r.horas_actuales} / Límite: ${r.proximo_mantenimiento_horas} (${r.porcentaje_uso}%).`
            });

        } else {
            // CORRECCIÓN #4: Por debajo del 80% → limpiar alertas obsoletas
            await alertaModel.eliminarResuelta('mantenimiento_por_horas_80',  r.fk_maquinaria, null, r.pk_mantenimiento);
            await alertaModel.eliminarResuelta('mantenimiento_por_horas_100', r.fk_maquinaria, null, r.pk_mantenimiento);
        }
    }
};

// ============================================
// 4. ALERTA USO INDEBIDO
// Mantenimiento vencido + se siguen registrando horas
// ============================================
const evaluarUsoIndebido = async () => {
    console.log('[alertas] Evaluando uso indebido...');

    const query = `
        SELECT DISTINCT ON (mt.fk_maquinaria)
            mt.pk_mantenimiento,
            mt.fk_maquinaria,
            mt.proximo_mantenimiento_fecha,
            m.numero_economico,
            m.marca,
            m.modelo,
            MAX(mh.fecha_registro) AS ultima_hora_registrada
        FROM mantenimiento mt
        JOIN maquinaria m ON mt.fk_maquinaria = m.pk_maquinaria
        JOIN maquinaria_hora mh ON mh.fk_maquinaria = mt.fk_maquinaria
        WHERE mt.proximo_mantenimiento_fecha IS NOT NULL
          AND mt.proximo_mantenimiento_fecha < CURRENT_DATE
          AND mt.estado_mantenimiento = 'finalizado'
          AND m.estado_operativo != 'baja'
          AND mh.fecha_registro > (mt.proximo_mantenimiento_fecha::TIMESTAMP)
        GROUP BY mt.pk_mantenimiento, mt.fk_maquinaria, mt.proximo_mantenimiento_fecha,
                 m.numero_economico, m.marca, m.modelo
        ORDER BY mt.fk_maquinaria, mt.proximo_mantenimiento_fecha DESC
    `;

    const { rows } = await Conexion.query(query);

    // CORRECCIÓN #4: Limpiar uso_indebido de activos que ya no lo tienen
    const pkConUsoIndebido = rows.map(r => r.fk_maquinaria);
    if (pkConUsoIndebido.length > 0) {
        await Conexion.query(
            `DELETE FROM alerta
             WHERE tipo_alerta = 'uso_indebido'
               AND tipo_activo = 'maquinaria'
               AND fk_maquinaria NOT IN (${pkConUsoIndebido.map((_, i) => `$${i + 1}`).join(',')})`,
            pkConUsoIndebido
        );
    } else {
        // Ningún activo tiene uso indebido → limpiar todos
        await Conexion.query(`DELETE FROM alerta WHERE tipo_alerta = 'uso_indebido'`);
    }

    for (const r of rows) {
        const nombre = `${r.marca} ${r.modelo} (${r.numero_economico})`;

        await insertarSiNoExiste({
            tipo_alerta: 'uso_indebido',
            categoria: 'critica',
            prioridad: 1,
            tipo_activo: 'maquinaria',
            fk_maquinaria: r.fk_maquinaria,
            fk_vehiculo: null,
            referencia_id: r.pk_mantenimiento,
            fecha_evento: r.ultima_hora_registrada,
            mensaje: `USO INDEBIDO detectado en ${nombre}. Se registraron horas después del vencimiento de mantenimiento (${r.proximo_mantenimiento_fecha}).`
        });
    }
};

// ============================================
// 5. ALERTA FALLAS SIN RESOLVER
// ============================================
const evaluarFallasSinResolver = async (diasLimite = 3) => {
    console.log('[alertas] Evaluando fallas sin resolver...');

    const query = `
        SELECT
            f.pk_falla,
            f.tipo_activo,
            f.fk_maquinaria,
            f.fk_vehiculo,
            f.descripcion,
            f.fecha_reporte,
            (CURRENT_DATE - f.fecha_reporte) AS dias_sin_resolver,
            COALESCE(m.numero_economico, v.numero_economico) AS numero_economico,
            COALESCE(m.marca, v.marca)   AS marca,
            COALESCE(m.modelo, v.modelo) AS modelo
        FROM falla f
        LEFT JOIN maquinaria m ON f.fk_maquinaria = m.pk_maquinaria
        LEFT JOIN vehiculo   v ON f.fk_vehiculo   = v.pk_vehiculo
        WHERE f.estado IN ('pendiente', 'en_proceso')
          AND (CURRENT_DATE - f.fecha_reporte) >= $1
    `;

    const { rows } = await Conexion.query(query, [diasLimite]);

    // CORRECCIÓN #4: Limpiar alertas de fallas que ya fueron resueltas
    const pkFallasPendientes = rows.map(r => r.pk_falla);
    if (pkFallasPendientes.length > 0) {
        await Conexion.query(
            `DELETE FROM alerta
             WHERE tipo_alerta = 'falla_sin_resolver'
               AND referencia_id NOT IN (${pkFallasPendientes.map((_, i) => `$${i + 1}`).join(',')})`,
            pkFallasPendientes
        );
    } else {
        // No hay fallas pendientes → limpiar todas las alertas de este tipo
        await Conexion.query(`DELETE FROM alerta WHERE tipo_alerta = 'falla_sin_resolver'`);
    }

    for (const r of rows) {
        const nombre = `${r.marca} ${r.modelo} (${r.numero_economico})`;

        await insertarSiNoExiste({
            tipo_alerta: 'falla_sin_resolver',
            categoria: 'critica',
            prioridad: 1,
            tipo_activo: r.tipo_activo,
            fk_maquinaria: r.fk_maquinaria,
            fk_vehiculo: r.fk_vehiculo,
            referencia_id: r.pk_falla,
            fecha_evento: r.fecha_reporte,
            mensaje: `Falla SIN RESOLVER en ${nombre} desde hace ${r.dias_sin_resolver} días. Descripción: ${r.descripcion.substring(0, 80)}.`
        });
    }
};

// ============================================
// 6. ALERTA CHECKLIST FALTANTE
// CORRECCIÓN #3: Solo insertar si no existe alerta HOY para ese activo
// ============================================
const evaluarChecklistFaltante = async () => {
    console.log('[alertas] Evaluando checklists faltantes...');

    const hoy = new Date().toISOString().split('T')[0];
    await Conexion.query(`
        DELETE FROM alerta a
        WHERE a.tipo_alerta = 'checklist_faltante'
        AND EXISTS (
            SELECT 1 FROM checklist_diario cd
            WHERE (
                (a.fk_maquinaria IS NOT NULL AND cd.fk_maquinaria = a.fk_maquinaria)
                OR
                (a.fk_vehiculo IS NOT NULL AND cd.fk_vehiculo = a.fk_vehiculo)
            )
            AND cd.fecha = CURRENT_DATE
            AND a.tipo_activo = cd.tipo_activo
        )
    `);
    const query = `
        SELECT
            m.pk_maquinaria,
            NULL::INT AS pk_vehiculo,
            'maquinaria' AS tipo_activo,
            m.numero_economico,
            m.marca,
            m.modelo
        FROM maquinaria m
        WHERE m.estado_operativo NOT IN ('baja', 'mantenimiento')
          AND NOT EXISTS (
              SELECT 1 FROM checklist_diario cd
              WHERE cd.fk_maquinaria = m.pk_maquinaria
                AND cd.fecha = CURRENT_DATE
          )

        UNION ALL

        SELECT
            NULL::INT AS pk_maquinaria,
            v.pk_vehiculo,
            'vehiculo' AS tipo_activo,
            v.numero_economico,
            v.marca,
            v.modelo
        FROM vehiculo v
        WHERE v.estado_operativo NOT IN ('baja', 'mantenimiento')
          AND NOT EXISTS (
              SELECT 1 FROM checklist_diario cd
              WHERE cd.fk_vehiculo = v.pk_vehiculo
                AND cd.fecha = CURRENT_DATE
          )
    `;

    const { rows } = await Conexion.query(query);

    for (const r of rows) {
        const nombre = `${r.marca} ${r.modelo} (${r.numero_economico})`;

        // CORRECCIÓN #3: insertarSiNoExiste verifica existeHoy() antes de insertar
        await insertarSiNoExiste({
            tipo_alerta: 'checklist_faltante',
            categoria: 'operativa',
            prioridad: 3,
            tipo_activo: r.tipo_activo,
            fk_maquinaria: r.pk_maquinaria,
            fk_vehiculo: r.pk_vehiculo,
            referencia_id: null,
            fecha_evento: hoy,
            mensaje: `Sin checklist diario hoy (${hoy}) para ${nombre}.`
        });
    }
};

// ============================================
// 7. ALERTA INACTIVIDAD
// CORRECCIÓN #3: Solo insertar si no existe alerta HOY para ese activo
// ============================================
const evaluarInactividad = async (diasLimite = 15) => {
    console.log('[alertas] Evaluando inactividad...');

    const query = `
        SELECT
            m.pk_maquinaria,
            NULL::INT AS pk_vehiculo,
            'maquinaria' AS tipo_activo,
            m.numero_economico,
            m.marca,
            m.modelo,
            MAX(mh.fecha_registro) AS ultimo_uso
        FROM maquinaria m
        LEFT JOIN maquinaria_hora mh ON mh.fk_maquinaria = m.pk_maquinaria
        WHERE m.estado_operativo NOT IN ('baja', 'mantenimiento')
        GROUP BY m.pk_maquinaria, m.numero_economico, m.marca, m.modelo
        HAVING MAX(mh.fecha_registro) < (CURRENT_TIMESTAMP - ($1 || ' days')::INTERVAL)
            OR MAX(mh.fecha_registro) IS NULL

        UNION ALL

        SELECT
            NULL::INT AS pk_maquinaria,
            v.pk_vehiculo,
            'vehiculo' AS tipo_activo,
            v.numero_economico,
            v.marca,
            v.modelo,
            MAX(vb.fecha_registro) AS ultimo_uso
        FROM vehiculo v
        LEFT JOIN vehiculo_bitacora vb ON vb.fk_vehiculo = v.pk_vehiculo
        WHERE v.estado_operativo NOT IN ('baja', 'mantenimiento')
        GROUP BY v.pk_vehiculo, v.numero_economico, v.marca, v.modelo
        HAVING MAX(vb.fecha_registro) < (CURRENT_TIMESTAMP - ($1 || ' days')::INTERVAL)
            OR MAX(vb.fecha_registro) IS NULL
    `;

    const { rows } = await Conexion.query(query, [diasLimite]);

    // CORRECCIÓN #4: Limpiar alertas de inactividad de activos que ya volvieron a usarse
    const maquinariasInactivas = rows.filter(r => r.pk_maquinaria).map(r => r.pk_maquinaria);
    const vehiculosInactivos   = rows.filter(r => r.pk_vehiculo).map(r => r.pk_vehiculo);

    if (maquinariasInactivas.length > 0) {
        await Conexion.query(
            `DELETE FROM alerta
             WHERE tipo_alerta = 'inactividad'
               AND tipo_activo = 'maquinaria'
               AND fk_maquinaria NOT IN (${maquinariasInactivas.map((_, i) => `$${i + 1}`).join(',')})`,
            maquinariasInactivas
        );
    } else {
        await Conexion.query(`DELETE FROM alerta WHERE tipo_alerta = 'inactividad' AND tipo_activo = 'maquinaria'`);
    }

    if (vehiculosInactivos.length > 0) {
        await Conexion.query(
            `DELETE FROM alerta
             WHERE tipo_alerta = 'inactividad'
               AND tipo_activo = 'vehiculo'
               AND fk_vehiculo NOT IN (${vehiculosInactivos.map((_, i) => `$${i + 1}`).join(',')})`,
            vehiculosInactivos
        );
    } else {
        await Conexion.query(`DELETE FROM alerta WHERE tipo_alerta = 'inactividad' AND tipo_activo = 'vehiculo'`);
    }

    for (const r of rows) {
        const nombre = `${r.marca} ${r.modelo} (${r.numero_economico})`;
        const ultimoUso = r.ultimo_uso
            ? new Date(r.ultimo_uso).toLocaleDateString('es-MX')
            : 'nunca';

        // CORRECCIÓN #3: insertarSiNoExiste verifica existeHoy() antes de insertar
        await insertarSiNoExiste({
            tipo_alerta: 'inactividad',
            categoria: 'operativa',
            prioridad: 3,
            tipo_activo: r.tipo_activo,
            fk_maquinaria: r.pk_maquinaria,
            fk_vehiculo: r.pk_vehiculo,
            referencia_id: null,
            fecha_evento: r.ultimo_uso || null,
            mensaje: `Inactividad detectada en ${nombre}. Último uso registrado: ${ultimoUso} (más de ${diasLimite} días).`
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
        await evaluarMantenimientoPorFecha();
        await evaluarMantenimientoPorHoras();
        await evaluarUsoIndebido();
        await evaluarFallasSinResolver(3);
        await evaluarChecklistFaltante();
        await evaluarInactividad(15);

        console.log('[alertas] Evaluación completada exitosamente.');
    } catch (error) {
        console.error('[alertas] Error durante la evaluación:', error.message);
        throw error;
    }
};

module.exports = {
    ejecutarTodasLasAlertas,
    evaluarGarantias,
    evaluarMantenimientoPorFecha,
    evaluarMantenimientoPorHoras,
    evaluarUsoIndebido,
    evaluarFallasSinResolver,
    evaluarChecklistFaltante,
    evaluarInactividad
};