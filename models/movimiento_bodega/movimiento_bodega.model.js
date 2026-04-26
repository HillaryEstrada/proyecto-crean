// ============================================
// MODELO: movimiento_bodega.model.js
// Descripción: Consultas SQL para movimientos de bodega
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Obtener stock actual de un producto en una bodega
    // ============================================
    obtenerStock: (fk_producto, fk_bodega) => Conexion.query(
        `SELECT stock_kg FROM inventario_bodega
         WHERE fk_producto = $1 AND fk_bodega = $2`,
        [fk_producto, fk_bodega]
    ),

    // ============================================
    // Crear movimiento completo (transacción)
    // ============================================
    crearMovimiento: async (data) => {
        const client = await Conexion.conectar().connect();
        try {
            await client.query('BEGIN');

            const movResult = await client.query(
                `INSERT INTO movimiento_bodega
                 (fk_bodega, tipo_movimiento, motivo, registrado_por, fecha)
                 VALUES ($1, $2, $3, $4, NOW())
                 RETURNING *`,
                [data.fk_bodega, data.tipo_movimiento, data.motivo || null, data.registrado_por]
            );
            const pk_movimiento = movResult.rows[0].pk_movimiento_bodega;

            for (const d of data.detalles) {
                if (data.tipo_movimiento === 'salida') {
                    const stockResult = await client.query(
                        `SELECT stock_kg FROM inventario_bodega
                         WHERE fk_producto = $1 AND fk_bodega = $2`,
                        [d.fk_producto, data.fk_bodega]
                    );
                    const stockActual = stockResult.rows[0]?.stock_kg || 0;
                    if (parseFloat(stockActual) < parseFloat(d.cantidad_kg)) {
                        throw { tipo: 'stock_insuficiente', producto: d.fk_producto };
                    }
                }

                await client.query(
                    `INSERT INTO detalle_movimiento_bodega
                     (fk_movimiento_bodega, fk_producto, cantidad_kg, cantidad_bultos,
                      peso_por_bulto, tipo_recepcion, humedad, analisis_calidad,
                      fk_productor, fk_ejido, fk_predio)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [
                        pk_movimiento, d.fk_producto, d.cantidad_kg,
                        d.cantidad_bultos || null, d.peso_por_bulto || null,
                        d.tipo_recepcion || null, d.humedad || null,
                        d.analisis_calidad || false,
                        d.fk_productor || null, d.fk_ejido || null, d.fk_predio || null
                    ]
                );

                const delta = data.tipo_movimiento === 'entrada'
                    ? parseFloat(d.cantidad_kg)
                    : -parseFloat(d.cantidad_kg);

                await client.query(
                    `INSERT INTO inventario_bodega (fk_producto, fk_bodega, stock_kg)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (fk_producto, fk_bodega)
                     DO UPDATE SET stock_kg = inventario_bodega.stock_kg + $3`,
                    [d.fk_producto, data.fk_bodega, delta]
                );
            }

            await client.query('COMMIT');
            return movResult.rows[0];

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // ============================================
    // Actualizar movimiento completo con reversión de inventario
    // 1. Revertir efecto original en inventario
    // 2. Eliminar detalles anteriores
    // 3. Actualizar encabezado
    // 4. Insertar nuevos detalles
    // 5. Aplicar nuevos efectos en inventario
    // ============================================
    actualizarMovimiento: async (id, data) => {
        const client = await Conexion.conectar().connect();
        try {
            await client.query('BEGIN');

            // 1. Obtener movimiento original
            const movOriginal = await client.query(
                `SELECT * FROM movimiento_bodega WHERE pk_movimiento_bodega = $1`, [id]
            );
            if (!movOriginal.rows.length) throw { tipo: 'no_encontrado' };
            const original = movOriginal.rows[0];

            // 2. Obtener detalles originales para revertir inventario
            const detallesOriginales = await client.query(
                `SELECT fk_producto, cantidad_kg FROM detalle_movimiento_bodega
                 WHERE fk_movimiento_bodega = $1`, [id]
            );

            // 3. Revertir efecto original en inventario
            for (const d of detallesOriginales.rows) {
                const deltaRevertir = original.tipo_movimiento === 'entrada'
                    ? -parseFloat(d.cantidad_kg)
                    :  parseFloat(d.cantidad_kg);

                await client.query(
                    `UPDATE inventario_bodega
                     SET stock_kg = stock_kg + $1
                     WHERE fk_producto = $2 AND fk_bodega = $3`,
                    [deltaRevertir, d.fk_producto, original.fk_bodega]
                );
            }

            // 4. Eliminar detalles anteriores
            await client.query(
                `DELETE FROM detalle_movimiento_bodega WHERE fk_movimiento_bodega = $1`, [id]
            );

            // 5. Actualizar encabezado
            await client.query(
                `UPDATE movimiento_bodega
                 SET fk_bodega = $1, tipo_movimiento = $2, motivo = $3
                 WHERE pk_movimiento_bodega = $4`,
                [data.fk_bodega, data.tipo_movimiento, data.motivo || null, id]
            );

            // 6. Insertar nuevos detalles y actualizar inventario
            for (const d of data.detalles) {
                if (data.tipo_movimiento === 'salida') {
                    const stockResult = await client.query(
                        `SELECT stock_kg FROM inventario_bodega
                         WHERE fk_producto = $1 AND fk_bodega = $2`,
                        [d.fk_producto, data.fk_bodega]
                    );
                    const stockActual = stockResult.rows[0]?.stock_kg || 0;
                    if (parseFloat(stockActual) < parseFloat(d.cantidad_kg)) {
                        throw { tipo: 'stock_insuficiente', producto: d.fk_producto };
                    }
                }

                await client.query(
                    `INSERT INTO detalle_movimiento_bodega
                     (fk_movimiento_bodega, fk_producto, cantidad_kg, cantidad_bultos,
                      peso_por_bulto, tipo_recepcion, humedad, analisis_calidad,
                      fk_productor, fk_ejido, fk_predio)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [
                        id, d.fk_producto, d.cantidad_kg,
                        d.cantidad_bultos || null, d.peso_por_bulto || null,
                        d.tipo_recepcion || null, d.humedad || null,
                        d.analisis_calidad || false,
                        d.fk_productor || null, d.fk_ejido || null, d.fk_predio || null
                    ]
                );

                const delta = data.tipo_movimiento === 'entrada'
                    ? parseFloat(d.cantidad_kg)
                    : -parseFloat(d.cantidad_kg);

                await client.query(
                    `INSERT INTO inventario_bodega (fk_producto, fk_bodega, stock_kg)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (fk_producto, fk_bodega)
                     DO UPDATE SET stock_kg = inventario_bodega.stock_kg + $3`,
                    [d.fk_producto, data.fk_bodega, delta]
                );
            }

            await client.query('COMMIT');

            const resultado = await Conexion.query(
                `SELECT mb.*, b.nombre AS bodega_nombre, usr.username AS registrado_por_usuario
                 FROM movimiento_bodega mb
                 LEFT JOIN bodega b  ON mb.fk_bodega      = b.pk_bodega
                 LEFT JOIN users usr ON mb.registrado_por  = usr.pk_user
                 WHERE mb.pk_movimiento_bodega = $1`, [id]
            );
            return resultado.rows[0];

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // ============================================
    // Listar todos los movimientos (con totales)
    // ============================================
    listar: () => Conexion.query(
        `SELECT
            mb.*,
            b.nombre                AS bodega_nombre,
            usr.username            AS registrado_por_usuario,
            COUNT(d.pk_detalle_bodega) AS total_productos,
            COALESCE(SUM(d.cantidad_kg), 0) AS total_kg
         FROM movimiento_bodega mb
         LEFT JOIN bodega b        ON mb.fk_bodega       = b.pk_bodega
         LEFT JOIN users usr       ON mb.registrado_por  = usr.pk_user
         LEFT JOIN detalle_movimiento_bodega d
                                   ON d.fk_movimiento_bodega = mb.pk_movimiento_bodega
         GROUP BY mb.pk_movimiento_bodega, b.nombre, usr.username
         ORDER BY mb.fecha DESC`
    ),

    // ============================================
    // Obtener movimiento por ID
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            mb.*,
            b.nombre                AS bodega_nombre,
            usr.username            AS registrado_por_usuario
         FROM movimiento_bodega mb
         LEFT JOIN bodega b   ON mb.fk_bodega      = b.pk_bodega
         LEFT JOIN users usr  ON mb.registrado_por = usr.pk_user
         WHERE mb.pk_movimiento_bodega = $1`,
        [id]
    ),

    // ============================================
    // Obtener detalle de un movimiento
    // ============================================
    obtenerDetalle: (id) => Conexion.query(
        `SELECT
            d.*,
            bp.nombre               AS producto_nombre,
            bp.tipo_grano,
            bp.variedad,
            pr.nombre               AS productor_nombre,
            e.nombre                AS ejido_nombre,
            pred.nombre             AS predio_nombre
         FROM detalle_movimiento_bodega d
         LEFT JOIN bodega_producto bp ON d.fk_producto  = bp.pk_producto
         LEFT JOIN productor pr       ON d.fk_productor = pr.pk_productor
         LEFT JOIN ejido e            ON d.fk_ejido     = e.pk_ejido
         LEFT JOIN predio pred        ON d.fk_predio    = pred.pk_predio
         WHERE d.fk_movimiento_bodega = $1
         ORDER BY d.pk_detalle_bodega ASC`,
        [id]
    )

};