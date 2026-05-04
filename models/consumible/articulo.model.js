// ============================================
// MODELO: articulo.model.js
// Descripción: Consultas SQL para inventario_articulo
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Crear artículo
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO inventario_articulo
            (nombre, descripcion, fk_partida, fk_unidad, fk_almacen, stock_minimo, categoria, stock, registrado_por, codigo_barras)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
            data.nombre,
            data.descripcion    || null,
            data.fk_partida     || null,
            data.fk_unidad      || null,
            data.fk_almacen     || null,
            data.stock_minimo   || 0,
            data.categoria      || null,
            data.stock_inicial  || 0,
            data.registrado_por || null,
            data.codigo_barras  || null
        ]
    ),

    // ============================================
    // Listar artículos activos (con joins)
    // ============================================
    listar: ({ nombre, categoria } = {}) => {
        let conditions = [`ia.estado = 1`];
        const params   = [];

        if (nombre) {
        params.push(`%${nombre}%`);
        conditions.push(`(ia.nombre ILIKE $${params.length} OR ia.codigo_barras ILIKE $${params.length})`);
        }
        if (categoria) {
            params.push(categoria);
            conditions.push(`ia.categoria = $${params.length}`);
        }

        return Conexion.query(
            `SELECT
                ia.pk_articulo,
                ia.nombre,
                ia.descripcion,
                ia.stock,
                ia.stock_minimo,
                ia.categoria,
                ia.estado,
                ia.fk_unidad,
                ia.fk_almacen,
                ia.fk_partida,
                ia.fecha_registro,
                u.nombre  AS unidad,
                a.nombre  AS almacen,
                pp.nombre AS partida,
                pp.clave  AS clave_partida,
                CASE
                    WHEN ia.stock = 0                THEN 'sin_stock'
                    WHEN ia.stock <= ia.stock_minimo THEN 'bajo'
                    ELSE 'ok'
                END AS estado_stock
             FROM inventario_articulo ia
             LEFT JOIN unidad_medida        u  ON u.pk_unidad   = ia.fk_unidad
             LEFT JOIN almacen              a  ON a.pk_almacen  = ia.fk_almacen
             LEFT JOIN partida_presupuestal pp ON pp.clave      = ia.fk_partida
             WHERE ${conditions.join(' AND ')}
             ORDER BY ia.categoria, ia.nombre`,
            params
        );
    },

    // ============================================
    // Listar artículos inactivos
    // ============================================
    listarInactivos: () => Conexion.query(
        `SELECT
            ia.pk_articulo,
            ia.nombre,
            ia.descripcion,
            ia.stock,
            ia.stock_minimo,
            ia.categoria,
            ia.estado,
            ia.fk_unidad,
            ia.fk_almacen,
            ia.fk_partida,
            ia.fecha_registro,
            u.nombre AS unidad,
            a.nombre AS almacen
         FROM inventario_articulo ia
         LEFT JOIN unidad_medida u ON u.pk_unidad  = ia.fk_unidad
         LEFT JOIN almacen       a ON a.pk_almacen = ia.fk_almacen
         WHERE ia.estado = 0
         ORDER BY ia.nombre ASC`
    ),

    // ============================================
    // Listar artículos con stock bajo
    // ============================================
    listarStockBajo: () => Conexion.query(
        `SELECT ia.nombre, ia.stock, ia.stock_minimo, u.nombre AS unidad
         FROM inventario_articulo ia
         LEFT JOIN unidad_medida u ON u.pk_unidad = ia.fk_unidad
         WHERE ia.estado = 1 AND ia.stock <= ia.stock_minimo
         ORDER BY ia.stock ASC`
    ),

    // ============================================
    // Listar categorías únicas existentes
    // ============================================
    listarCategorias: () => Conexion.query(
        `SELECT DISTINCT categoria
         FROM inventario_articulo
         WHERE categoria IS NOT NULL AND estado = 1
         ORDER BY categoria`
    ),

    // ============================================
    // Obtener artículo por ID
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            ia.*,
            u.nombre  AS unidad,
            a.nombre  AS almacen,
            pp.nombre AS partida
         FROM inventario_articulo ia
         LEFT JOIN unidad_medida        u  ON u.pk_unidad   = ia.fk_unidad
         LEFT JOIN almacen              a  ON a.pk_almacen  = ia.fk_almacen
         LEFT JOIN partida_presupuestal pp ON pp.clave      = ia.fk_partida
         WHERE ia.pk_articulo = $1`,
        [id]
    ),

    // ============================================
    // Verificar nombre duplicado
    // ============================================
    existeNombre: (nombre, idActual = null) => Conexion.query(
        `SELECT pk_articulo FROM inventario_articulo
         WHERE LOWER(nombre) = LOWER($1) ${idActual ? `AND pk_articulo != $2` : ''}`,
        idActual ? [nombre, idActual] : [nombre]
    ),

    // ============================================
    // Actualizar artículo (sin tocar stock)
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE inventario_articulo SET
            nombre       = COALESCE($1, nombre),
            descripcion  = $2,
            fk_partida   = $3,
            fk_unidad    = $4,
            fk_almacen   = $5,
            stock_minimo = COALESCE($6, stock_minimo),
            categoria    = $7
         WHERE pk_articulo = $8
         RETURNING *`,
        [
            data.nombre,
            data.descripcion  || null,
            data.fk_partida   || null,
            data.fk_unidad    || null,
            data.fk_almacen   || null,
            data.stock_minimo,
            data.categoria    || null,
            id
        ]
    ),

    // ============================================
    // Desactivar artículo (baja lógica, estado = 0)
    // ============================================
    desactivar: (id) => Conexion.query(
        `UPDATE inventario_articulo SET estado = 0 WHERE pk_articulo = $1 RETURNING *`,
        [id]
    ),

    // ============================================
    // Reactivar artículo (estado = 1)
    // ============================================
    reactivar: (id) => Conexion.query(
        `UPDATE inventario_articulo SET estado = 1 WHERE pk_articulo = $1 RETURNING *`,
        [id]
    ),

    // ============================================
    // Actualizar stock (usado en transacciones de movimientos)
    // ============================================
    actualizarStock: (client, id, cantidad, tipo) => {
        const operacion = tipo === 'entrada' ? '+' : '-';
        return client.query(
            `UPDATE inventario_articulo
             SET stock = stock ${operacion} $1
             WHERE pk_articulo = $2
             RETURNING stock`,
            [cantidad, id]
        );
    },

    // ============================================
    // Obtener stock actual con bloqueo (FOR UPDATE)
    // ============================================
    obtenerStock: (client, id) => client.query(
        `SELECT stock FROM inventario_articulo WHERE pk_articulo = $1 FOR UPDATE`,
        [id]
    ),

     // ============================================
    // Buscar por código de barras
    // ============================================
    buscarPorCodigo: (codigo) => Conexion.query(
        `SELECT
            ia.pk_articulo,
            ia.nombre,
            ia.stock,
            ia.codigo_barras,
            u.nombre AS unidad
         FROM inventario_articulo ia
         LEFT JOIN unidad_medida u ON u.pk_unidad = ia.fk_unidad
         WHERE ia.codigo_barras = $1 AND ia.estado = 1`,
        [codigo]
    ),

    // ============================================
    // Verificar código de barras duplicado
    // ============================================
    existeCodigoBarras: (codigo, idActual = null) => Conexion.query(
        `SELECT pk_articulo FROM inventario_articulo
         WHERE codigo_barras = $1 ${idActual ? `AND pk_articulo != $2` : ''}`,
        idActual ? [codigo, idActual] : [codigo]
    )

};