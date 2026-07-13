// ============================================
// MODELO: comodato.model.js
// Descripción: Consultas SQL para comodato
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Crear comodato
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO comodato
        (fk_solicitud, fk_productor, cultivo, superficie_ha, num_beneficiarios,
         fecha_entrega, fecha_devolucion_esperada, dias_prestamo,
         estado, observaciones, registrado_por)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
            data.fk_solicitud               || null,
            data.fk_productor,
            data.cultivo                    || null,
            data.superficie_ha              || null,
            data.num_beneficiarios          || null,
            data.fecha_entrega              || null,
            data.fecha_devolucion_esperada  || null,
            data.dias_prestamo              || null,
            data.estado                     || 'programado',
            data.observaciones              || null,
            data.registrado_por
        ]
    ),

    // ============================================
    // Listar comodatos activos (NO cancelados ni finalizados)
    // ============================================
    listar: () => Conexion.query(
        `SELECT 
            c.*,
            pr.nombre    as productor_nombre,
            pr.curp      as productor_curp,
            pr.telefono  as productor_telefono,
            s.folio      as solicitud_folio,
            usr.username as registrado_por_usuario
        FROM comodato c
        LEFT JOIN productor   pr  ON c.fk_productor   = pr.pk_productor
        LEFT JOIN solicitud_comodato s ON c.fk_solicitud = s.pk_solicitud
        LEFT JOIN users       usr ON c.registrado_por = usr.pk_user
        WHERE c.estado NOT IN ('cancelado', 'finalizado')
        ORDER BY c.pk_comodato ASC`
    ),

    // ============================================
    // Listar todos (incluye cancelados y finalizados)
    // ============================================
    listarTodos: () => Conexion.query(
        `SELECT 
            c.*,
            pr.nombre    as productor_nombre,
            pr.curp      as productor_curp,
            pr.telefono  as productor_telefono,
            s.folio      as solicitud_folio,
            usr.username as registrado_por_usuario
        FROM comodato c
        LEFT JOIN productor   pr  ON c.fk_productor   = pr.pk_productor
        LEFT JOIN solicitud_comodato s ON c.fk_solicitud = s.pk_solicitud
        LEFT JOIN users       usr ON c.registrado_por = usr.pk_user
        ORDER BY c.pk_comodato ASC`
    ),

    // ============================================
    // Listar por estado
    // (programado | activo | finalizado | incumplido | cancelado)
    // ============================================
    listarPorEstado: (estado) => Conexion.query(
        `SELECT 
            c.*,
            pr.nombre    as productor_nombre,
            pr.curp      as productor_curp,
            pr.telefono  as productor_telefono,
            s.folio      as solicitud_folio,
            usr.username as registrado_por_usuario
        FROM comodato c
        LEFT JOIN productor   pr  ON c.fk_productor   = pr.pk_productor
        LEFT JOIN solicitud_comodato s ON c.fk_solicitud = s.pk_solicitud
        LEFT JOIN users       usr ON c.registrado_por = usr.pk_user
        WHERE c.estado = $1
        ORDER BY c.pk_comodato ASC`,
        [estado]
    ),

    // ============================================
    // Obtener por ID (con detalles completos)
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT 
            c.*,
            pr.nombre    as productor_nombre,
            pr.curp      as productor_curp,
            pr.telefono  as productor_telefono,
            pr.fk_ejido,
            pr.fk_predio,
            s.folio      as solicitud_folio,
            s.estado     as solicitud_estado,
            usr.username as registrado_por_usuario,
            uac.username as actualizado_por_usuario
        FROM comodato c
        LEFT JOIN productor          pr  ON c.fk_productor    = pr.pk_productor
        LEFT JOIN solicitud_comodato s   ON c.fk_solicitud    = s.pk_solicitud
        LEFT JOIN users              usr ON c.registrado_por  = usr.pk_user
        LEFT JOIN users              uac ON c.actualizado_por = uac.pk_user
        WHERE c.pk_comodato = $1`,
        [id]
    ),

    // ============================================
    // Obtener detalles (maquinaria) de un comodato
    // ============================================
    obtenerDetalles: (id) => Conexion.query(
        `SELECT 
            cd.*,
            m.numero_economico,
            m.marca,
            m.modelo,
            m.estado_operativo,
            te.nombre as tipo_nombre
        FROM comodato_detalle cd
        LEFT JOIN maquinaria  m  ON cd.fk_maquinaria = m.pk_maquinaria
        LEFT JOIN tipo_equipo te ON m.fk_tipo         = te.pk_tipo_equipo
        WHERE cd.fk_comodato = $1
        ORDER BY cd.pk_detalle ASC`,
        [id]
    ),

    // ============================================
    // Actualizar comodato (update parcial con COALESCE)
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE comodato
        SET
            fk_solicitud              = COALESCE($1,  fk_solicitud),
            fk_productor              = COALESCE($2,  fk_productor),
            cultivo                   = COALESCE($3,  cultivo),
            superficie_ha             = COALESCE($4,  superficie_ha),
            num_beneficiarios         = COALESCE($5,  num_beneficiarios),
            fecha_entrega             = COALESCE($6,  fecha_entrega),
            fecha_devolucion_esperada = COALESCE($7,  fecha_devolucion_esperada),
            dias_prestamo             = COALESCE($8,  dias_prestamo),
            observaciones             = COALESCE($9,  observaciones),
            actualizado_por           = $10,
            fecha_actualizacion       = CURRENT_TIMESTAMP
        WHERE pk_comodato = $11
        RETURNING *`,
        [
            data.fk_solicitud,
            data.fk_productor,
            data.cultivo,
            data.superficie_ha,
            data.num_beneficiarios,
            data.fecha_entrega,
            data.fecha_devolucion_esperada,
            data.dias_prestamo,
            data.observaciones,
            data.actualizado_por,
            id
        ]
    ),

    // ============================================
    // Cambiar estado
    // (programado | activo | finalizado | incumplido | cancelado)
    // ============================================
    cambiarEstado: (id, data) => Conexion.query(
        `UPDATE comodato
        SET estado=$1, actualizado_por=$2, fecha_actualizacion=CURRENT_TIMESTAMP
        WHERE pk_comodato=$3
        RETURNING *`,
        [data.estado, data.actualizado_por, id]
    ),

    // ============================================
    // Cancelar comodato (baja lógica -> estado = cancelado)
    // ============================================
    cancelar: (id, actualizado_por) => Conexion.query(
        `UPDATE comodato
        SET estado='cancelado', actualizado_por=$1, fecha_actualizacion=CURRENT_TIMESTAMP
        WHERE pk_comodato=$2
        RETURNING *`,
        [actualizado_por, id]
    ),

    // ============================================
    // Verificar existencia por ID
    // ============================================
    existe: (id) => Conexion.query(
        `SELECT pk_comodato FROM comodato WHERE pk_comodato = $1`,
        [id]
    )

};