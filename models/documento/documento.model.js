// ============================================
// MODELO: documento.model.js
// Descripción: Consultas SQL para documento_oficial
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Listar documentos activos (no cancelados)
    // ============================================
    listar: () => Conexion.query(
        `SELECT
            d.*,
            c.fk_productor,
            c.cultivo,
            usr.username AS registrado_por_usuario
        FROM documento_oficial d
        LEFT JOIN comodato  c   ON d.fk_comodato  = c.pk_comodato
        LEFT JOIN users     usr ON d.registrado_por = usr.pk_user
        WHERE d.estado != 'cancelado'
        ORDER BY d.pk_documento ASC`
    ),

    // ============================================
    // Listar todos los documentos (sin filtro)
    // ============================================
    listarTodos: () => Conexion.query(
        `SELECT
            d.*,
            c.fk_productor,
            c.cultivo,
            usr.username AS registrado_por_usuario
        FROM documento_oficial d
        LEFT JOIN comodato  c   ON d.fk_comodato  = c.pk_comodato
        LEFT JOIN users     usr ON d.registrado_por = usr.pk_user
        ORDER BY d.fecha_registro DESC`
    ),

    // ============================================
    // Obtener por ID (con detalles completos)
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            d.*,
            c.fk_productor,
            c.cultivo,
            c.estado           AS comodato_estado,
            usr.username       AS registrado_por_usuario
        FROM documento_oficial d
        LEFT JOIN comodato  c   ON d.fk_comodato  = c.pk_comodato
        LEFT JOIN users     usr ON d.registrado_por = usr.pk_user
        WHERE d.pk_documento = $1`,
        [id]
    ),

    // ============================================
    // Listar documentos por comodato
    // ============================================
    listarPorComodato: (fk_comodato) => Conexion.query(
        `SELECT
            d.*,
            usr.username AS registrado_por_usuario
        FROM documento_oficial d
        LEFT JOIN users usr ON d.registrado_por = usr.pk_user
        WHERE d.fk_comodato = $1
        ORDER BY d.fecha_registro DESC`,
        [fk_comodato]
    ),

    // ============================================
    // Listar documentos por tipo
    // ============================================
    listarPorTipo: (tipo_documento) => Conexion.query(
        `SELECT
            d.*,
            c.cultivo,
            usr.username AS registrado_por_usuario
        FROM documento_oficial d
        LEFT JOIN comodato  c   ON d.fk_comodato  = c.pk_comodato
        LEFT JOIN users     usr ON d.registrado_por = usr.pk_user
        WHERE d.tipo_documento = $1
        ORDER BY d.fecha_registro DESC`,
        [tipo_documento]
    ),

    // ============================================
    // Crear documento
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO documento_oficial
        (fk_comodato, tipo_documento, numero_folio, fecha_documento,
         contenido_json, estado, registrado_por)
        VALUES($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
            data.fk_comodato     || null,
            data.tipo_documento,
            data.numero_folio,
            data.fecha_documento || null,
            data.contenido_json  ? JSON.stringify(data.contenido_json) : null,
            data.estado          || 'borrador',
            data.registrado_por
        ]
    ),

    // ============================================
    // Actualizar documento
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE documento_oficial
        SET
            tipo_documento      = COALESCE($1, tipo_documento),
            numero_folio        = COALESCE($2, numero_folio),
            fecha_documento     = COALESCE($3, fecha_documento),
            contenido_json      = COALESCE($4, contenido_json),
            estado              = COALESCE($5, estado),
            actualizado_por     = $6,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE pk_documento = $7
        RETURNING *`,
        [
            data.tipo_documento,
            data.numero_folio,
            data.fecha_documento,
            data.contenido_json ? JSON.stringify(data.contenido_json) : undefined,
            data.estado,
            data.actualizado_por,
            id
        ]
    ),

    // ============================================
    // Cambiar estado del documento
    // ============================================
    cambiarEstado: (id, estado, actualizado_por) => Conexion.query(
        `UPDATE documento_oficial
        SET estado = $1,
            actualizado_por     = $2,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE pk_documento = $3
        RETURNING *`,
        [estado, actualizado_por, id]
    ),

    // ============================================
    // Eliminar documento (cancelación lógica)
    // ============================================
    eliminar: (id, actualizado_por) => Conexion.query(
        `UPDATE documento_oficial
        SET estado = 'cancelado',
            actualizado_por     = $1,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE pk_documento = $2
        RETURNING pk_documento`,
        [actualizado_por, id]
    ),

    // ============================================
    // Verificar existencia por ID
    // ============================================
    existe: (id) => Conexion.query(
        `SELECT pk_documento FROM documento_oficial WHERE pk_documento = $1`,
        [id]
    ),

    // ============================================
    // Verificar folio duplicado
    // ============================================
    existePorFolio: (numero_folio, idActual = null) => Conexion.query(
        `SELECT pk_documento FROM documento_oficial
         WHERE numero_folio = $1 ${idActual ? 'AND pk_documento != $2' : ''}`,
        idActual ? [numero_folio, idActual] : [numero_folio]
    )

};