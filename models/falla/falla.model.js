// ============================================
// MODELO: falla.model.js
// Descripción: Consultas SQL para falla
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Listar fallas activas (no canceladas ni resueltas)
    // ============================================
    listar: () => Conexion.query(
        `SELECT
            f.*,
            cd.fk_comodato,
            cd.fk_maquinaria,
            m.numero_economico,
            m.marca,
            m.modelo,
            usr.username AS registrado_por_usuario
        FROM falla f
        LEFT JOIN comodato_detalle cd  ON f.fk_detalle   = cd.pk_detalle
        LEFT JOIN maquinaria        m  ON cd.fk_maquinaria = m.pk_maquinaria
        LEFT JOIN users           usr  ON f.registrado_por = usr.pk_user
        WHERE f.estado NOT IN ('resuelto', 'cancelado')
        ORDER BY f.pk_falla ASC`
    ),

    // ============================================
    // Listar todas las fallas (sin filtro de estado)
    // ============================================
    listarTodas: () => Conexion.query(
        `SELECT
            f.*,
            cd.fk_comodato,
            cd.fk_maquinaria,
            m.numero_economico,
            m.marca,
            m.modelo,
            usr.username AS registrado_por_usuario
        FROM falla f
        LEFT JOIN comodato_detalle cd  ON f.fk_detalle   = cd.pk_detalle
        LEFT JOIN maquinaria        m  ON cd.fk_maquinaria = m.pk_maquinaria
        LEFT JOIN users           usr  ON f.registrado_por = usr.pk_user
        ORDER BY f.fecha_registro DESC`
    ),

    // ============================================
    // Obtener por ID (con detalles completos)
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            f.*,
            cd.fk_comodato,
            cd.fk_maquinaria,
            cd.observaciones AS detalle_observaciones,
            m.numero_economico,
            m.marca,
            m.modelo,
            m.estado_operativo,
            usr.username AS registrado_por_usuario
        FROM falla f
        LEFT JOIN comodato_detalle cd  ON f.fk_detalle   = cd.pk_detalle
        LEFT JOIN maquinaria        m  ON cd.fk_maquinaria = m.pk_maquinaria
        LEFT JOIN users           usr  ON f.registrado_por = usr.pk_user
        WHERE f.pk_falla = $1`,
        [id]
    ),

    // ============================================
    // Listar fallas por estado
    // ============================================
    listarPorEstado: (estado) => Conexion.query(
        `SELECT
            f.*,
            cd.fk_comodato,
            cd.fk_maquinaria,
            m.numero_economico,
            m.marca,
            m.modelo,
            usr.username AS registrado_por_usuario
        FROM falla f
        LEFT JOIN comodato_detalle cd  ON f.fk_detalle   = cd.pk_detalle
        LEFT JOIN maquinaria        m  ON cd.fk_maquinaria = m.pk_maquinaria
        LEFT JOIN users           usr  ON f.registrado_por = usr.pk_user
        WHERE f.estado = $1
        ORDER BY f.fecha_registro DESC`,
        [estado]
    ),

    // ============================================
    // Listar fallas por comodato_detalle (fk_detalle)
    // ============================================
    listarPorDetalle: (fk_detalle) => Conexion.query(
        `SELECT
            f.*,
            usr.username AS registrado_por_usuario
        FROM falla f
        LEFT JOIN users usr ON f.registrado_por = usr.pk_user
        WHERE f.fk_detalle = $1
        ORDER BY f.fecha_registro DESC`,
        [fk_detalle]
    ),

    // ============================================
    // Crear falla
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO falla
        (fk_detalle, fk_traslado, tipo, urgencia, descripcion,
         estado, origen, fecha_reporte, observaciones, registrado_por)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
            data.fk_detalle              || null,
            data.fk_traslado             || null,
            data.tipo,
            data.urgencia                || 'normal',
            data.descripcion,
            data.estado                  || 'pendiente',
            data.origen                  || 'comodatos',
            data.fecha_reporte           || null,
            data.observaciones           || null,
            data.registrado_por
        ]
    ),

    // ============================================
    // Actualizar falla
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE falla
        SET
            tipo          = COALESCE($1, tipo),
            urgencia      = COALESCE($2, urgencia),
            descripcion   = COALESCE($3, descripcion),
            estado        = COALESCE($4, estado),
            origen        = COALESCE($5, origen),
            fecha_reporte = COALESCE($6, fecha_reporte),
            observaciones = COALESCE($7, observaciones),
            actualizado_por      = $8,
            fecha_actualizacion  = CURRENT_TIMESTAMP
        WHERE pk_falla = $9
        RETURNING *`,
        [
            data.tipo,
            data.urgencia,
            data.descripcion,
            data.estado,
            data.origen,
            data.fecha_reporte,
            data.observaciones,
            data.actualizado_por,
            id
        ]
    ),

    // ============================================
    // Cambiar estado de la falla
    // ============================================
    cambiarEstado: (id, estado, actualizado_por) => Conexion.query(
        `UPDATE falla
        SET estado = $1,
            actualizado_por     = $2,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE pk_falla = $3
        RETURNING *`,
        [estado, actualizado_por, id]
    ),

    // ============================================
    // Eliminar falla (cancelación lógica)
    // ============================================
    eliminar: (id, actualizado_por) => Conexion.query(
        `UPDATE falla
        SET estado = 'cancelado',
            actualizado_por     = $1,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE pk_falla = $2
        RETURNING pk_falla`,
        [actualizado_por, id]
    ),

    // ============================================
    // Verificar existencia por ID
    // ============================================
    existe: (id) => Conexion.query(
        `SELECT pk_falla FROM falla WHERE pk_falla = $1`,
        [id]
    )

};