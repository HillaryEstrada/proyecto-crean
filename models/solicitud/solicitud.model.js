// ============================================
// MODELO: solicitud.model.js
// Descripción: Consultas SQL para solicitud_comodato
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Crear solicitud
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO solicitud_comodato
        (folio, fk_productor, superficie_ha, cultivo, num_beneficiarios,
         documento_ceder, estado, fecha_solicitud, observaciones, registrado_por)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
            data.folio,
            data.fk_productor,
            data.superficie_ha       || null,
            data.cultivo             || null,
            data.num_beneficiarios   || null,
            data.documento_ceder     || null,
            data.estado              || 'pendiente',
            data.fecha_solicitud     || null,
            data.observaciones       || null,
            data.registrado_por
        ]
    ),

    // ============================================
    // Listar solicitudes activas (NO canceladas)
    // ============================================
    listar: () => Conexion.query(
        `SELECT 
            s.*,
            pr.nombre    as productor_nombre,
            pr.curp      as productor_curp,
            pr.telefono  as productor_telefono,
            usr.username as registrado_por_usuario
        FROM solicitud_comodato s
        LEFT JOIN productor pr  ON s.fk_productor   = pr.pk_productor
        LEFT JOIN users     usr ON s.registrado_por = usr.pk_user
        WHERE s.estado != 'cancelada'
        ORDER BY s.pk_solicitud ASC`
    ),

    // ============================================
    // Listar todas (incluye canceladas/rechazadas)
    // ============================================
    listarTodas: () => Conexion.query(
        `SELECT 
            s.*,
            pr.nombre    as productor_nombre,
            pr.curp      as productor_curp,
            pr.telefono  as productor_telefono,
            usr.username as registrado_por_usuario
        FROM solicitud_comodato s
        LEFT JOIN productor pr  ON s.fk_productor   = pr.pk_productor
        LEFT JOIN users     usr ON s.registrado_por = usr.pk_user
        ORDER BY s.pk_solicitud ASC`
    ),

    // ============================================
    // Listar por estado (pendiente | aprobada | rechazada | cancelada)
    // ============================================
    listarPorEstado: (estado) => Conexion.query(
        `SELECT 
            s.*,
            pr.nombre    as productor_nombre,
            pr.curp      as productor_curp,
            pr.telefono  as productor_telefono,
            usr.username as registrado_por_usuario
        FROM solicitud_comodato s
        LEFT JOIN productor pr  ON s.fk_productor   = pr.pk_productor
        LEFT JOIN users     usr ON s.registrado_por = usr.pk_user
        WHERE s.estado = $1
        ORDER BY s.pk_solicitud ASC`,
        [estado]
    ),

    // ============================================
    // Obtener por ID (con detalles completos)
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT 
            s.*,
            pr.nombre    as productor_nombre,
            pr.curp      as productor_curp,
            pr.telefono  as productor_telefono,
            pr.fk_ejido,
            pr.fk_predio,
            usr.username as registrado_por_usuario,
            uac.username as actualizado_por_usuario
        FROM solicitud_comodato s
        LEFT JOIN productor pr  ON s.fk_productor    = pr.pk_productor
        LEFT JOIN users     usr ON s.registrado_por  = usr.pk_user
        LEFT JOIN users     uac ON s.actualizado_por = uac.pk_user
        WHERE s.pk_solicitud = $1`,
        [id]
    ),

    // ============================================
    // Actualizar solicitud (update parcial con COALESCE)
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE solicitud_comodato 
        SET 
            fk_productor        = COALESCE($1, fk_productor),
            superficie_ha       = COALESCE($2, superficie_ha),
            cultivo              = COALESCE($3, cultivo),
            num_beneficiarios    = COALESCE($4, num_beneficiarios),
            documento_ceder      = COALESCE($5, documento_ceder),
            fecha_solicitud      = COALESCE($6, fecha_solicitud),
            observaciones        = COALESCE($7, observaciones),
            actualizado_por      = $8,
            fecha_actualizacion  = CURRENT_TIMESTAMP
        WHERE pk_solicitud = $9
        RETURNING *`,
        [
            data.fk_productor,
            data.superficie_ha,
            data.cultivo,
            data.num_beneficiarios,
            data.documento_ceder,
            data.fecha_solicitud,
            data.observaciones,
            data.actualizado_por,
            id
        ]
    ),

    // ============================================
    // Cambiar estado (pendiente -> aprobada / rechazada / cancelada)
    // ============================================
    cambiarEstado: (id, data) => Conexion.query(
        `UPDATE solicitud_comodato
        SET estado=$1, actualizado_por=$2, fecha_actualizacion=CURRENT_TIMESTAMP
        WHERE pk_solicitud=$3
        RETURNING *`,
        [data.estado, data.actualizado_por, id]
    ),

    // ============================================
    // Eliminar (baja lógica -> estado = cancelada)
    // ============================================
    eliminar: (id, actualizado_por) => Conexion.query(
        `UPDATE solicitud_comodato
        SET estado='cancelada', actualizado_por=$1, fecha_actualizacion=CURRENT_TIMESTAMP
        WHERE pk_solicitud=$2
        RETURNING *`,
        [actualizado_por, id]
    ),

    // ============================================
    // Verificar existencia por ID
    // ============================================
    existe: (id) => Conexion.query(
        `SELECT pk_solicitud FROM solicitud_comodato WHERE pk_solicitud = $1`,
        [id]
    ),

    // ============================================
    // Verificar existencia por folio (UNIQUE)
    // ============================================
    existePorFolio: (folio, idActual = null) => Conexion.query(
        `SELECT pk_solicitud FROM solicitud_comodato
         WHERE folio = $1 ${idActual ? 'AND pk_solicitud != $2' : ''}`,
        idActual ? [folio, idActual] : [folio]
    )

};