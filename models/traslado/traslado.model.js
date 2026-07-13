// ============================================
// MODELO: traslado.model.js
// Descripción: Consultas SQL para operacion_traslado
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Listar traslados activos (sin fecha de llegada aún)
    // ============================================
    listar: () => Conexion.query(
        `SELECT
            t.*,
            c.fk_productor,
            c.cultivo,
            v.numero_economico AS vehiculo_numero_economico,
            v.marca            AS vehiculo_marca,
            v.modelo           AS vehiculo_modelo,
            usr.username       AS registrado_por_usuario
        FROM operacion_traslado t
        LEFT JOIN comodato  c   ON t.fk_comodato = c.pk_comodato
        LEFT JOIN vehiculo  v   ON t.fk_vehiculo  = v.pk_vehiculo
        LEFT JOIN users     usr ON t.registrado_por = usr.pk_user
        WHERE t.fecha_llegada IS NULL
        ORDER BY t.pk_traslado ASC`
    ),

    // ============================================
    // Listar todos los traslados (sin filtro)
    // ============================================
    listarTodos: () => Conexion.query(
        `SELECT
            t.*,
            c.fk_productor,
            c.cultivo,
            v.numero_economico AS vehiculo_numero_economico,
            v.marca            AS vehiculo_marca,
            v.modelo           AS vehiculo_modelo,
            usr.username       AS registrado_por_usuario
        FROM operacion_traslado t
        LEFT JOIN comodato  c   ON t.fk_comodato = c.pk_comodato
        LEFT JOIN vehiculo  v   ON t.fk_vehiculo  = v.pk_vehiculo
        LEFT JOIN users     usr ON t.registrado_por = usr.pk_user
        ORDER BY t.fecha_registro DESC`
    ),

    // ============================================
    // Obtener por ID (con detalles completos)
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            t.*,
            c.fk_productor,
            c.cultivo,
            c.estado           AS comodato_estado,
            v.numero_economico AS vehiculo_numero_economico,
            v.marca            AS vehiculo_marca,
            v.modelo           AS vehiculo_modelo,
            v.placas           AS vehiculo_placas,
            usr.username       AS registrado_por_usuario
        FROM operacion_traslado t
        LEFT JOIN comodato  c   ON t.fk_comodato = c.pk_comodato
        LEFT JOIN vehiculo  v   ON t.fk_vehiculo  = v.pk_vehiculo
        LEFT JOIN users     usr ON t.registrado_por = usr.pk_user
        WHERE t.pk_traslado = $1`,
        [id]
    ),

    // ============================================
    // Listar traslados por comodato
    // ============================================
    listarPorComodato: (fk_comodato) => Conexion.query(
        `SELECT
            t.*,
            v.numero_economico AS vehiculo_numero_economico,
            v.marca            AS vehiculo_marca,
            usr.username       AS registrado_por_usuario
        FROM operacion_traslado t
        LEFT JOIN vehiculo  v   ON t.fk_vehiculo  = v.pk_vehiculo
        LEFT JOIN users     usr ON t.registrado_por = usr.pk_user
        WHERE t.fk_comodato = $1
        ORDER BY t.fecha_registro DESC`,
        [fk_comodato]
    ),

    // ============================================
    // Crear traslado
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO operacion_traslado
        (fk_comodato, tipo, destino, fecha_salida, fecha_llegada,
         fk_vehiculo, km_salida, km_llegada,
         foto_tablero_salida, foto_tablero_llegada,
         observaciones, registrado_por)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
            data.fk_comodato,
            data.tipo              || 'entrega',
            data.destino,
            data.fecha_salida      || null,
            data.fecha_llegada     || null,
            data.fk_vehiculo       || null,
            data.km_salida         || null,
            data.km_llegada        || null,
            data.foto_tablero_salida  || null,
            data.foto_tablero_llegada || null,
            data.observaciones     || null,
            data.registrado_por
        ]
    ),

    // ============================================
    // Actualizar traslado
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE operacion_traslado
        SET
            tipo                 = COALESCE($1,  tipo),
            destino              = COALESCE($2,  destino),
            fecha_salida         = COALESCE($3,  fecha_salida),
            fecha_llegada        = COALESCE($4,  fecha_llegada),
            fk_vehiculo          = COALESCE($5,  fk_vehiculo),
            km_salida            = COALESCE($6,  km_salida),
            km_llegada           = COALESCE($7,  km_llegada),
            foto_tablero_salida  = COALESCE($8,  foto_tablero_salida),
            foto_tablero_llegada = COALESCE($9,  foto_tablero_llegada),
            observaciones        = COALESCE($10, observaciones),
            actualizado_por      = $11,
            fecha_actualizacion  = CURRENT_TIMESTAMP
        WHERE pk_traslado = $12
        RETURNING *`,
        [
            data.tipo,
            data.destino,
            data.fecha_salida,
            data.fecha_llegada,
            data.fk_vehiculo,
            data.km_salida,
            data.km_llegada,
            data.foto_tablero_salida,
            data.foto_tablero_llegada,
            data.observaciones,
            data.actualizado_por,
            id
        ]
    ),

    // ============================================
    // Registrar llegada (cierre del traslado)
    // ============================================
    registrarLlegada: (id, data) => Conexion.query(
        `UPDATE operacion_traslado
        SET
            fecha_llegada        = COALESCE($1, fecha_llegada),
            km_llegada           = COALESCE($2, km_llegada),
            foto_tablero_llegada = COALESCE($3, foto_tablero_llegada),
            observaciones        = COALESCE($4, observaciones),
            actualizado_por      = $5,
            fecha_actualizacion  = CURRENT_TIMESTAMP
        WHERE pk_traslado = $6
        RETURNING *`,
        [
            data.fecha_llegada        || null,
            data.km_llegada           || null,
            data.foto_tablero_llegada || null,
            data.observaciones        || null,
            data.actualizado_por,
            id
        ]
    ),

    // ============================================
    // Eliminar traslado (DELETE físico)
    // Solo aplica si aún no tiene fecha_llegada registrada
    // ============================================
    eliminar: (id) => Conexion.query(
        `DELETE FROM operacion_traslado
        WHERE pk_traslado = $1
        RETURNING pk_traslado`,
        [id]
    ),

    // ============================================
    // Verificar existencia por ID
    // ============================================
    existe: (id) => Conexion.query(
        `SELECT pk_traslado FROM operacion_traslado WHERE pk_traslado = $1`,
        [id]
    )

};