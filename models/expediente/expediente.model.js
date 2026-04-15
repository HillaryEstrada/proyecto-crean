// ============================================
// MODELO: expediente.model.js
// Descripción: Consultas SQL para el expediente de maquinaria
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ── Datos base de la máquina + factura + garantía ──────────────────────
    obtenerDatosBase: (id) => Conexion.query(
        `SELECT
            m.*,
            f.numero_factura,
            f.fecha_compra,
            f.proveedor,
            f.monto_total       AS factura_monto,
            f.pk_factura,
            g.numero_garantia,
            g.fecha_inicio      AS garantia_inicio,
            g.fecha_fin         AS garantia_fin,
            g.proveedor         AS garantia_proveedor,
            g.pk_garantia,
            CASE
                WHEN g.fecha_fin IS NULL THEN NULL
                WHEN g.fecha_fin < NOW() THEN 'vencida'
                ELSE 'vigente'
            END                 AS garantia_estado
        FROM maquinaria m
        LEFT JOIN factura  f ON f.fk_maquinaria = m.pk_maquinaria
        LEFT JOIN garantia g ON g.fk_maquinaria = m.pk_maquinaria
        WHERE m.pk_maquinaria = $1`,
        [id]
    ),

    // ── KPIs ───────────────────────────────────────────────────────────────
    obtenerKpis: (id) => Conexion.query(
        `SELECT
            -- Horas y combustible acumulados
            COALESCE(SUM(mh.horas_trabajadas), 0)       AS horas_actuales,
            COALESCE(SUM(mh.combustible_litros), 0)     AS combustible_litros,

            -- Conteos
            (SELECT COUNT(*) FROM mantenimiento
             WHERE fk_maquinaria = $1)                  AS total_mantenimientos,

            (SELECT COUNT(*) FROM falla
             WHERE fk_maquinaria = $1)                  AS total_fallas,

            -- Costo total de mano de obra en mantenimientos
            (SELECT COALESCE(SUM(costo_mano_obra), 0)
             FROM mantenimiento
             WHERE fk_maquinaria = $1)                  AS costo_total_mantenimiento

        FROM maquinaria_hora mh
        WHERE mh.fk_maquinaria = $1`,
        [id]
    ),

    // ── Alertas ────────────────────────────────────────────────────────────
    obtenerAlertas: (id) => Conexion.query(
        `-- Fallas pendientes / sin resolver
        SELECT
            'falla'              AS tipo,
            'warning'            AS nivel,
            'Falla activa'       AS titulo,
            descripcion          AS detalle,
            fecha_reporte        AS fecha
        FROM falla
        WHERE fk_maquinaria = $1
          AND COALESCE(estado, 'pendiente') NOT IN ('resuelta', 'cerrada')

        UNION ALL

        -- Garantía vencida
        SELECT
            'garantia'                AS tipo,
            'danger'                  AS nivel,
            'Garantía vencida'        AS titulo,
            CONCAT('Venció el ', TO_CHAR(fecha_fin, 'DD/MM/YYYY')) AS detalle,
            fecha_fin                 AS fecha
        FROM garantia
        WHERE fk_maquinaria = $1
          AND fecha_fin < NOW()

        UNION ALL

        -- Próximo mantenimiento programado (en los siguientes 30 días)
        SELECT
            'mantenimiento'                         AS tipo,
            'info'                                  AS nivel,
            'Mantenimiento próximo'                 AS titulo,
            CONCAT('Programado para el ',
                TO_CHAR(fecha_programada, 'DD/MM/YYYY')) AS detalle,
            fecha_programada                        AS fecha
        FROM mantenimiento
        WHERE fk_maquinaria = $1
          AND fecha_programada BETWEEN NOW() AND NOW() + INTERVAL '30 days'
          AND COALESCE(estado, 'pendiente') NOT IN ('completado', 'cancelado')

        ORDER BY fecha ASC`,
        [id]
    ),

    // ── Historial unificado (timeline) ─────────────────────────────────────
    obtenerHistorial: (id) => Conexion.query(
        `-- Mantenimientos realizados
        SELECT
            'mantenimiento'                     AS origen,
            pk_mantenimiento::TEXT              AS ref_id,
            fecha_realizada                     AS fecha,
            COALESCE(tipo_mantenimiento, 'Mantenimiento') AS titulo,
            descripcion                         AS detalle
        FROM mantenimiento
        WHERE fk_maquinaria = $1
          AND fecha_realizada IS NOT NULL

        UNION ALL

        -- Registros de horas/uso
        SELECT
            'uso'                               AS origen,
            pk_maquinaria_hora::TEXT            AS ref_id,
            fecha                               AS fecha,
            'Registro de uso'                   AS titulo,
            CONCAT(horas_trabajadas, ' hrs · ',
                combustible_litros, ' L')       AS detalle
        FROM maquinaria_hora
        WHERE fk_maquinaria = $1

        UNION ALL

        -- Cambios de estado
        SELECT
            'estado'                            AS origen,
            pk_historial_estado::TEXT           AS ref_id,
            fecha_cambio                        AS fecha,
            'Cambio de estado'                  AS titulo,
            CONCAT('→ ', estado_nuevo)          AS detalle
        FROM maquinaria_historial_estado
        WHERE fk_maquinaria = $1

        ORDER BY fecha DESC
        LIMIT 100`,
        [id]
    ),

    // ── Uso (maquinaria_hora) ──────────────────────────────────────────────
    obtenerUso: (id) => Conexion.query(
        `SELECT
            pk_maquinaria_hora,
            fecha,
            horas_trabajadas,
            combustible_litros,
            operador,
            actividad,
            observaciones
        FROM maquinaria_hora
        WHERE fk_maquinaria = $1
        ORDER BY fecha DESC`,
        [id]
    ),

    // ── Mantenimientos ─────────────────────────────────────────────────────
    obtenerMantenimientos: (id) => Conexion.query(
        `SELECT
            pk_mantenimiento,
            tipo_mantenimiento,
            descripcion,
            fecha_programada,
            fecha_realizada,
            costo_mano_obra,
            costo_refacciones,
            estado,
            tecnico,
            observaciones
        FROM mantenimiento
        WHERE fk_maquinaria = $1
        ORDER BY COALESCE(fecha_realizada, fecha_programada) DESC`,
        [id]
    ),

    // ── Fallas ────────────────────────────────────────────────────────────
    obtenerFallas: (id) => Conexion.query(
        `SELECT
            pk_falla,
            descripcion,
            fecha_reporte,
            fecha_resolucion,
            estado,
            severidad,
            reportado_por,
            solucion
        FROM falla
        WHERE fk_maquinaria = $1
        ORDER BY fecha_reporte DESC`,
        [id]
    ),

    // ── Checklist diario ──────────────────────────────────────────────────
    obtenerChecklist: (id) => Conexion.query(
        `SELECT
            pk_checklist_diario,
            fecha,
            operador,
            turno,
            resultado_general,
            observaciones
        FROM checklist_diario
        WHERE fk_maquinaria = $1
        ORDER BY fecha DESC
        LIMIT 50`,
        [id]
    ),

};