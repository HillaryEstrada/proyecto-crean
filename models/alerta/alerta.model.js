// ============================================
// MODELO: alerta.model.js
// Descripción: Consultas SQL para el módulo de alertas
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Listar todas las alertas (con info del activo)
    // ============================================
    listar: () => Conexion.query(
        `SELECT
            a.*,
            m.numero_economico AS maquinaria_economico,
            m.marca            AS maquinaria_marca,
            m.modelo           AS maquinaria_modelo,
            v.numero_economico AS vehiculo_economico,
            v.marca            AS vehiculo_marca,
            v.modelo           AS vehiculo_modelo
        FROM alerta a
        LEFT JOIN maquinaria m ON a.fk_maquinaria = m.pk_maquinaria
        LEFT JOIN vehiculo   v ON a.fk_vehiculo   = v.pk_vehiculo
        ORDER BY a.prioridad ASC, a.fecha_generada DESC`
    ),

    // ============================================
    // Listar alertas pendientes (no leídas)
    // ============================================
    listarPendientes: () => Conexion.query(
        `SELECT
            a.*,
            m.numero_economico AS maquinaria_economico,
            m.marca            AS maquinaria_marca,
            m.modelo           AS maquinaria_modelo,
            v.numero_economico AS vehiculo_economico,
            v.marca            AS vehiculo_marca,
            v.modelo           AS vehiculo_modelo
        FROM alerta a
        LEFT JOIN maquinaria m ON a.fk_maquinaria = m.pk_maquinaria
        LEFT JOIN vehiculo   v ON a.fk_vehiculo   = v.pk_vehiculo
        WHERE a.leida = FALSE
        ORDER BY a.prioridad ASC, a.fecha_generada DESC`
    ),

    // ============================================
    // Listar alertas por maquinaria
    // ============================================
    listarPorMaquinaria: (id) => Conexion.query(
        `SELECT *
        FROM alerta
        WHERE fk_maquinaria = $1
        ORDER BY prioridad ASC, fecha_generada DESC`,
        [id]
    ),

    // ============================================
    // Listar alertas por vehículo
    // ============================================
    listarPorVehiculo: (id) => Conexion.query(
        `SELECT *
        FROM alerta
        WHERE fk_vehiculo = $1
        ORDER BY prioridad ASC, fecha_generada DESC`,
        [id]
    ),

    // ============================================
    // Marcar alerta como leída
    // ============================================
    marcarLeida: (id) => Conexion.query(
        `UPDATE alerta
         SET leida = TRUE
         WHERE pk_alerta = $1
         RETURNING *`,
        [id]
    ),

    // ============================================
    // Marcar todas las alertas de un activo como leídas
    // ============================================
    marcarTodasLeidasMaquinaria: (id) => Conexion.query(
        `UPDATE alerta
         SET leida = TRUE
         WHERE fk_maquinaria = $1
         RETURNING *`,
        [id]
    ),

    marcarTodasLeidasVehiculo: (id) => Conexion.query(
        `UPDATE alerta
         SET leida = TRUE
         WHERE fk_vehiculo = $1
         RETURNING *`,
        [id]
    ),

    // ============================================
    // Insertar alerta (con protección contra duplicados)
    // ============================================
    insertar: (data) => Conexion.query(
        `INSERT INTO alerta
        (tipo_alerta, categoria, prioridad, tipo_activo,
         fk_maquinaria, fk_vehiculo, referencia_id, mensaje, fecha_evento)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
        RETURNING *`,
        [
            data.tipo_alerta,
            data.categoria,
            data.prioridad,
            data.tipo_activo,
            data.fk_maquinaria || null,
            data.fk_vehiculo   || null,
            data.referencia_id || null,
            data.mensaje,
            data.fecha_evento  || null
        ]
    ),

    // ============================================
    // Eliminar alertas resueltas (ya no aplica la condición)
    // ============================================
    eliminarResuelta: (tipo_alerta, fk_maquinaria, fk_vehiculo, referencia_id) => Conexion.query(
        `DELETE FROM alerta
         WHERE tipo_alerta = $1
           AND (fk_maquinaria = $2 OR fk_vehiculo = $3)
           AND (referencia_id = $4 OR ($4::INT IS NULL AND referencia_id IS NULL))`,
        [tipo_alerta, fk_maquinaria || null, fk_vehiculo || null, referencia_id || null]
    ),

    // ============================================
    // [NUEVO] Verificar si ya existe una alerta HOY
    // Evita spam de alertas diarias (checklist, inactividad)
    // ============================================
    existeHoy: (tipo_alerta, fk_maquinaria, fk_vehiculo) => Conexion.query(
        `SELECT pk_alerta FROM alerta
         WHERE tipo_alerta = $1
           AND (fk_maquinaria = $2 OR fk_vehiculo = $3)
           AND fecha_generada::DATE = CURRENT_DATE
         LIMIT 1`,
        [tipo_alerta, fk_maquinaria || null, fk_vehiculo || null]
    ),

    // ============================================
    // [NUEVO] Eliminar todas las alertas de un tipo
    // para un activo (limpieza masiva por tipo)
    // Ej: eliminar todas las de 'checklist_faltante' de hoy
    // ============================================
    eliminarPorTipoYActivo: (tipo_alerta, fk_maquinaria, fk_vehiculo) => Conexion.query(
        `DELETE FROM alerta
         WHERE tipo_alerta = $1
           AND (
               ($2::INT IS NOT NULL AND fk_maquinaria = $2)
               OR
               ($3::INT IS NOT NULL AND fk_vehiculo = $3)
           )`,
        [tipo_alerta, fk_maquinaria || null, fk_vehiculo || null]
    ),

    // ============================================
    // Contar alertas pendientes (para badge en frontend)
    // ============================================
    contarPendientes: () => Conexion.query(
        `SELECT
            COUNT(*) FILTER (WHERE categoria = 'critica')    AS criticas,
            COUNT(*) FILTER (WHERE categoria = 'preventiva') AS preventivas,
            COUNT(*) FILTER (WHERE categoria = 'operativa')  AS operativas,
            COUNT(*) AS total
        FROM alerta
        WHERE leida = FALSE`
    )

};