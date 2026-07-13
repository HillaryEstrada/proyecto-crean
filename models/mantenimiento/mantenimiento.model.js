// ============================================
// MODELO: mantenimiento.model.js
// Descripción: Consultas SQL para mantenimiento
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Listar mantenimientos activos (no terminados ni cancelados)
    // ============================================
    listar: () => Conexion.query(
        `SELECT
            mt.*,
            cd.fk_comodato,
            cd.fk_maquinaria,
            m.numero_economico,
            m.marca,
            m.modelo,
            f.tipo        AS falla_tipo,
            f.descripcion AS falla_descripcion,
            usr.username  AS registrado_por_usuario
        FROM mantenimiento mt
        LEFT JOIN comodato_detalle cd  ON mt.fk_detalle  = cd.pk_detalle
        LEFT JOIN maquinaria        m  ON cd.fk_maquinaria = m.pk_maquinaria
        LEFT JOIN falla             f  ON mt.fk_falla    = f.pk_falla
        LEFT JOIN users           usr  ON mt.registrado_por = usr.pk_user
        WHERE mt.estado NOT IN ('terminado', 'cancelado')
        ORDER BY mt.pk_mantenimiento ASC`
    ),

    // ============================================
    // Listar todos los mantenimientos (sin filtro de estado)
    // ============================================
    listarTodos: () => Conexion.query(
        `SELECT
            mt.*,
            cd.fk_comodato,
            cd.fk_maquinaria,
            m.numero_economico,
            m.marca,
            m.modelo,
            f.tipo        AS falla_tipo,
            f.descripcion AS falla_descripcion,
            usr.username  AS registrado_por_usuario
        FROM mantenimiento mt
        LEFT JOIN comodato_detalle cd  ON mt.fk_detalle  = cd.pk_detalle
        LEFT JOIN maquinaria        m  ON cd.fk_maquinaria = m.pk_maquinaria
        LEFT JOIN falla             f  ON mt.fk_falla    = f.pk_falla
        LEFT JOIN users           usr  ON mt.registrado_por = usr.pk_user
        ORDER BY mt.fecha_registro DESC`
    ),

    // ============================================
    // Obtener por ID (con detalles completos)
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            mt.*,
            cd.fk_comodato,
            cd.fk_maquinaria,
            m.numero_economico,
            m.marca,
            m.modelo,
            m.estado_operativo,
            f.tipo        AS falla_tipo,
            f.urgencia    AS falla_urgencia,
            f.descripcion AS falla_descripcion,
            usr.username  AS registrado_por_usuario
        FROM mantenimiento mt
        LEFT JOIN comodato_detalle cd  ON mt.fk_detalle  = cd.pk_detalle
        LEFT JOIN maquinaria        m  ON cd.fk_maquinaria = m.pk_maquinaria
        LEFT JOIN falla             f  ON mt.fk_falla    = f.pk_falla
        LEFT JOIN users           usr  ON mt.registrado_por = usr.pk_user
        WHERE mt.pk_mantenimiento = $1`,
        [id]
    ),

    // ============================================
    // Listar mantenimientos por estado
    // ============================================
    listarPorEstado: (estado) => Conexion.query(
        `SELECT
            mt.*,
            cd.fk_comodato,
            cd.fk_maquinaria,
            m.numero_economico,
            m.marca,
            m.modelo,
            usr.username AS registrado_por_usuario
        FROM mantenimiento mt
        LEFT JOIN comodato_detalle cd  ON mt.fk_detalle  = cd.pk_detalle
        LEFT JOIN maquinaria        m  ON cd.fk_maquinaria = m.pk_maquinaria
        LEFT JOIN users           usr  ON mt.registrado_por = usr.pk_user
        WHERE mt.estado = $1
        ORDER BY mt.fecha_registro DESC`,
        [estado]
    ),

    // ============================================
    // Listar mantenimientos por comodato_detalle (fk_detalle)
    // ============================================
    listarPorDetalle: (fk_detalle) => Conexion.query(
        `SELECT
            mt.*,
            f.tipo        AS falla_tipo,
            f.descripcion AS falla_descripcion,
            usr.username  AS registrado_por_usuario
        FROM mantenimiento mt
        LEFT JOIN falla    f   ON mt.fk_falla      = f.pk_falla
        LEFT JOIN users  usr   ON mt.registrado_por = usr.pk_user
        WHERE mt.fk_detalle = $1
        ORDER BY mt.fecha_registro DESC`,
        [fk_detalle]
    ),

    // ============================================
    // Crear mantenimiento
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO mantenimiento
        (fk_detalle, fk_falla, tipo_manto, descripcion, estado,
         taller, tecnico, costo_estimado, costo_real,
         fecha_inicio, fecha_fin_estimada, fecha_fin_real,
         repuestos_usados, observaciones, registrado_por)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
            data.fk_detalle          || null,
            data.fk_falla            || null,
            data.tipo_manto          || 'correctivo',
            data.descripcion,
            data.estado              || 'programado',
            data.taller              || null,
            data.tecnico             || null,
            data.costo_estimado      || null,
            data.costo_real          || null,
            data.fecha_inicio        || null,
            data.fecha_fin_estimada  || null,
            data.fecha_fin_real      || null,
            data.repuestos_usados    || null,
            data.observaciones       || null,
            data.registrado_por
        ]
    ),

    // ============================================
    // Actualizar mantenimiento
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE mantenimiento
        SET
            tipo_manto         = COALESCE($1,  tipo_manto),
            descripcion        = COALESCE($2,  descripcion),
            estado             = COALESCE($3,  estado),
            taller             = COALESCE($4,  taller),
            tecnico            = COALESCE($5,  tecnico),
            costo_estimado     = COALESCE($6,  costo_estimado),
            costo_real         = COALESCE($7,  costo_real),
            fecha_inicio       = COALESCE($8,  fecha_inicio),
            fecha_fin_estimada = COALESCE($9,  fecha_fin_estimada),
            fecha_fin_real     = COALESCE($10, fecha_fin_real),
            repuestos_usados   = COALESCE($11, repuestos_usados),
            observaciones      = COALESCE($12, observaciones),
            actualizado_por     = $13,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE pk_mantenimiento = $14
        RETURNING *`,
        [
            data.tipo_manto,
            data.descripcion,
            data.estado,
            data.taller,
            data.tecnico,
            data.costo_estimado,
            data.costo_real,
            data.fecha_inicio,
            data.fecha_fin_estimada,
            data.fecha_fin_real,
            data.repuestos_usados,
            data.observaciones,
            data.actualizado_por,
            id
        ]
    ),

    // ============================================
    // Cambiar estado del mantenimiento
    // ============================================
    cambiarEstado: (id, estado, actualizado_por) => Conexion.query(
        `UPDATE mantenimiento
        SET estado = $1,
            actualizado_por     = $2,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE pk_mantenimiento = $3
        RETURNING *`,
        [estado, actualizado_por, id]
    ),

    // ============================================
    // Terminar mantenimiento + liberar maquinaria
    // Se hace en dos queries separados (sin transacción real)
    // porque Conexion no tiene getClient().
    // El controlador debe manejar el orden y capturar errores.
    // ============================================
    terminar: (id, data) => Conexion.query(
        `UPDATE mantenimiento
        SET estado          = 'terminado',
            fecha_fin_real  = COALESCE($1, CURRENT_DATE),
            costo_real      = COALESCE($2, costo_real),
            repuestos_usados = COALESCE($3, repuestos_usados),
            observaciones   = COALESCE($4, observaciones),
            actualizado_por     = $5,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE pk_mantenimiento = $6
        RETURNING *`,
        [
            data.fecha_fin_real      || null,
            data.costo_real          || null,
            data.repuestos_usados    || null,
            data.observaciones       || null,
            data.actualizado_por,
            id
        ]
    ),

    // ============================================
    // Liberar maquinaria al terminar mantenimiento
    // (paso 2 del terminar — llamado desde el controlador)
    // ============================================
    liberarMaquinaria: (fk_maquinaria) => Conexion.query(
        `UPDATE maquinaria
        SET estado_operativo = 'disponible'
        WHERE pk_maquinaria = $1
        RETURNING pk_maquinaria, estado_operativo`,
        [fk_maquinaria]
    ),

    // ============================================
    // Eliminar mantenimiento (cancelación lógica)
    // ============================================
    eliminar: (id, actualizado_por) => Conexion.query(
        `UPDATE mantenimiento
        SET estado = 'cancelado',
            actualizado_por     = $1,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE pk_mantenimiento = $2
        RETURNING pk_mantenimiento`,
        [actualizado_por, id]
    ),

    // ============================================
    // Verificar existencia por ID
    // ============================================
    existe: (id) => Conexion.query(
        `SELECT pk_mantenimiento FROM mantenimiento WHERE pk_mantenimiento = $1`,
        [id]
    )

};