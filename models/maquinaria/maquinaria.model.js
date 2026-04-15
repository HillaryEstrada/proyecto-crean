// ============================================
// MODELO: maquinaria.model.js
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ─────────────────────────────────────────
    // CATÁLOGOS
    // ─────────────────────────────────────────

    listarTipos: () => Conexion.query(
        `SELECT pk_tipo AS id, nombre
         FROM tipo_equipo
         ORDER BY nombre ASC`
    ),

    crearTipo: (nombre) => Conexion.query(
        `INSERT INTO tipo_equipo (nombre)
         VALUES ($1)
         RETURNING pk_tipo, nombre`,
        [nombre]
    ),

    listarUbicaciones: () => Conexion.query(
        `SELECT
            u.pk_ubicacion,
            u.nombre,
            c.nombre AS categoria
         FROM ubicacion u
         LEFT JOIN categoria_ubicacion c ON u.fk_categoria = c.pk_categoria
         WHERE u.activo = true
         ORDER BY u.nombre ASC`
    ),

    // ─────────────────────────────────────────
    // PROVEEDORES
    // ─────────────────────────────────────────

    listarProveedores: () => Conexion.query(
        `SELECT pk_proveedor AS id, nombre
         FROM proveedor
         ORDER BY nombre ASC`
    ),

    crearProveedor: (data) => Conexion.query(
        `INSERT INTO proveedor (nombre, direccion, telefono, correo)
         VALUES ($1, $2, $3, $4)
         RETURNING pk_proveedor, nombre`,
        [
            data.nombre,
            data.direccion || null,
            data.telefono  || null,
            data.correo    || null
        ]
    ),

    // ─────────────────────────────────────────
    // MAQUINARIA
    // ─────────────────────────────────────────

    listar: () => Conexion.query(
        `SELECT
            m.*,
            te.nombre AS tipo_nombre,
            u.nombre  AS ubicacion_nombre
         FROM maquinaria m
         LEFT JOIN tipo_equipo te ON m.fk_tipo      = te.pk_tipo
         LEFT JOIN ubicacion   u  ON m.fk_ubicacion = u.pk_ubicacion
         WHERE m.estado_operativo != 'baja'
         ORDER BY m.pk_maquinaria ASC`
    ),

    obtenerPorId: (id) => Conexion.query(
        `SELECT
            m.*,
            te.nombre AS tipo_nombre,
            u.nombre  AS ubicacion_nombre
         FROM maquinaria m
         LEFT JOIN tipo_equipo te ON m.fk_tipo      = te.pk_tipo
         LEFT JOIN ubicacion   u  ON m.fk_ubicacion = u.pk_ubicacion
         WHERE m.pk_maquinaria = $1`,
        [id]
    ),

    crear: (data) => Conexion.query(
        `INSERT INTO maquinaria (
            numero_economico, numero_inventario_seder,
            fk_tipo, descripcion, marca, modelo, anio, color, serie,
            estado_fisico, estado_operativo,
            fk_ubicacion, fk_factura, fk_garantia,
            foto_maquina, registrado_por
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        RETURNING pk_maquinaria`,
        [
            data.numero_economico,
            data.numero_inventario_seder || null,
            data.fk_tipo                 || null,
            data.descripcion             || null,
            data.marca                   || null,
            data.modelo                  || null,
            data.anio                    || null,
            data.color                   || null,
            data.serie                   || null,
            data.estado_fisico           || 'bueno',
            data.estado_operativo        || 'disponible',
            data.fk_ubicacion            || null,
            data.fk_factura              || null,
            data.fk_garantia             || null,
            data.foto_maquina            || null,
            data.registrado_por          || null
        ]
    ),

    actualizar: (id, data) => Conexion.query(
        `UPDATE maquinaria SET
            fk_tipo          = $1,
            marca            = $2,
            modelo           = $3,
            anio             = $4,
            color            = $5,
            serie            = $6,
            descripcion      = $7,
            estado_fisico    = $8,
            estado_operativo = $9,
            fk_ubicacion     = $10,
            fk_factura       = $11,
            fk_garantia      = $12
         WHERE pk_maquinaria = $13`,
        [
            data.fk_tipo,
            data.marca,
            data.modelo,
            data.anio,
            data.color,
            data.serie,
            data.descripcion,
            data.estado_fisico,
            data.estado_operativo,
            data.fk_ubicacion,
            data.fk_factura  || null,
            data.fk_garantia || null,
            id
        ]
    ),

    desactivar: (id) => Conexion.query(
        `UPDATE maquinaria
         SET estado_operativo = 'baja'
         WHERE pk_maquinaria  = $1`,
        [id]
    ),

    desaparecer: (id) => Conexion.query(
        `DELETE FROM maquinaria
         WHERE pk_maquinaria = $1`,
        [id]
    ),

    // ─────────────────────────────────────────
    // FACTURA
    // ─────────────────────────────────────────

    crearFactura: (data) => Conexion.query(
        `INSERT INTO factura (numero_factura, fecha_factura, costo_adquisicion, pdf_factura, fk_proveedor)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING pk_factura`,
        [
            data.numero_factura,
            data.fecha_factura,
            data.costo_adquisicion || null,
            data.pdf_factura       || null,
            data.fk_proveedor      || null
        ]
    ),

    // ─────────────────────────────────────────
    // GARANTÍA
    // ─────────────────────────────────────────

    crearGarantia: (data) => Conexion.query(
        `INSERT INTO garantia (fecha_inicio, fecha_fin, limite_horas, garantia_pdf)
         VALUES ($1,$2,$3,$4)
         RETURNING pk_garantia`,
        [
            data.fecha_inicio  || null,
            data.fecha_fin     || null,
            data.limite_horas  || null,
            data.garantia_pdf  || null
        ]
    ),
    listarBajas: () => Conexion.query(
        `SELECT
            m.*,
            te.nombre AS tipo_nombre,
            u.nombre  AS ubicacion_nombre
        FROM maquinaria m
        LEFT JOIN tipo_equipo te ON m.fk_tipo      = te.pk_tipo
        LEFT JOIN ubicacion   u  ON m.fk_ubicacion = u.pk_ubicacion
        WHERE m.estado_operativo = 'baja'
        ORDER BY m.pk_maquinaria ASC`
    ),
    listarCategoriasUbicacion: () => Conexion.query(
    `SELECT pk_categoria AS id, nombre
     FROM categoria_ubicacion
     ORDER BY nombre ASC`
)

    
};

