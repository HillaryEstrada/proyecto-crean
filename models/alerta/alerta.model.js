// ============================================
// MODELO: alerta.model.js
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Listar todas las alertas
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
    // Listar por maquinaria
    // ============================================
    listarPorMaquinaria: (id) => Conexion.query(
        `SELECT * FROM alerta
         WHERE fk_maquinaria = $1
         ORDER BY prioridad ASC, fecha_generada DESC`,
        [id]
    ),

    // ============================================
    // Listar por vehículo
    // ============================================
    listarPorVehiculo: (id) => Conexion.query(
        `SELECT * FROM alerta
         WHERE fk_vehiculo = $1
         ORDER BY prioridad ASC, fecha_generada DESC`,
        [id]
    ),

    // ============================================
    // Marcar una alerta como leída
    // ============================================
    marcarLeida: (id) => Conexion.query(
        `UPDATE alerta SET leida = TRUE
         WHERE pk_alerta = $1
         RETURNING *`,
        [id]
    ),

    // ============================================
    // Marcar todas las alertas de una maquinaria como leídas
    // ============================================
    marcarTodasLeidasMaquinaria: (id) => Conexion.query(
        `UPDATE alerta SET leida = TRUE
         WHERE fk_maquinaria = $1
         RETURNING *`,
        [id]
    ),

    // ============================================
    // Marcar todas las alertas de un vehículo como leídas
    // ============================================
    marcarTodasLeidasVehiculo: (id) => Conexion.query(
        `UPDATE alerta SET leida = TRUE
         WHERE fk_vehiculo = $1
         RETURNING *`,
        [id]
    ),

    // ============================================
    // Insertar alerta de garantía (maquinaria o vehículo)
    // ON CONFLICT DO NOTHING evita duplicados por UNIQUE
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
    // Insertar alerta de inventario (bajo_stock)
    // Si ya existe, actualiza el mensaje y la marca como no leída
    // ============================================
    insertarInventario: (data) => Conexion.query(
        `INSERT INTO alerta
            (tipo_alerta, categoria, prioridad, tipo_activo,
             fk_maquinaria, fk_vehiculo, referencia_id, mensaje, fecha_evento)
         VALUES ($1, $2, $3, $4, NULL, NULL, $5, $6, NULL)
         ON CONFLICT (tipo_alerta, referencia_id)
         DO UPDATE SET
             mensaje        = EXCLUDED.mensaje,
             leida          = FALSE,
             fecha_generada = CURRENT_TIMESTAMP
         RETURNING *`,
        [
            data.tipo_alerta,
            data.categoria,
            data.prioridad,
            data.tipo_activo,
            data.referencia_id,
            data.mensaje
        ]
    ),

    // ============================================
    // Eliminar alerta de un tipo específico por activo y factura
    // Usado para limpiar etapas obsoletas de garantía
    // ============================================
    eliminarPorTipoYReferencia: (tipo_alerta, fk_maquinaria, fk_vehiculo, referencia_id) => Conexion.query(
        `DELETE FROM alerta
         WHERE tipo_alerta = $1
           AND (
               ($2::INT IS NOT NULL AND fk_maquinaria = $2)
               OR
               ($3::INT IS NOT NULL AND fk_vehiculo   = $3)
           )
           AND referencia_id = $4`,
        [tipo_alerta, fk_maquinaria || null, fk_vehiculo || null, referencia_id]
    ),

    // ============================================
    // Contar alertas pendientes (badge del frontend)
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