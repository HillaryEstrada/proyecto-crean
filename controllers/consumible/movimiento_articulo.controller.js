// ============================================
// CONTROLADOR: movimiento_articulo.controller.js
// ============================================

const Conexion        = require('../../config/database');
const movimientoModel = require('../../models/consumible/movimiento_articulo.model');
const articuloModel   = require('../../models/consumible/articulo.model');

// ============================================
// Registrar movimiento
// ============================================
exports.registrar = async (req, res) => {
    const client = await Conexion.conectar().connect();
    try {
        const {
            fk_articulo, tipo_movimiento, cantidad, motivo,
            recibido_por, fk_area, referencia,
            numero_factura, fecha_factura, folio_memorandum, autorizado_por,
            archivo_factura, archivo_acta, tipo_baja
        } = req.body;

        if (!fk_articulo)               return res.status(400).json({ error: 'El artículo es obligatorio' });
        if (!tipo_movimiento)           return res.status(400).json({ error: 'El tipo de movimiento es obligatorio' });
        if (!cantidad || cantidad <= 0) return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
        if (!motivo)                    return res.status(400).json({ error: 'El motivo es obligatorio' });

        const tiposValidos = ['entrada', 'salida', 'baja'];
        if (!tiposValidos.includes(tipo_movimiento))
            return res.status(400).json({ error: 'Tipo de movimiento inválido. Use: entrada, salida o baja' });

        if (tipo_movimiento === 'entrada' && !numero_factura)
            return res.status(400).json({ error: 'El número de factura es obligatorio para entradas' });

        if (tipo_movimiento === 'salida') {
            if (!fk_area)        return res.status(400).json({ error: 'El área es obligatoria para salidas' });
            if (!recibido_por)   return res.status(400).json({ error: 'El empleado que recibe es obligatorio para salidas' });
            if (!autorizado_por) return res.status(400).json({ error: 'El empleado que autoriza es obligatorio para salidas' });
        }

        await client.query('BEGIN');

        const stockResult = await articuloModel.obtenerStock(client, fk_articulo);
        if (!stockResult.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }

        const stockActual = stockResult.rows[0].stock;

        if (tipo_movimiento === 'salida' || tipo_movimiento === 'baja') {
            if (stockActual < cantidad) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: `Stock insuficiente. Stock actual: ${stockActual}, cantidad solicitada: ${cantidad}`
                });
            }
        }

        let folio_vale = null;
        if (tipo_movimiento === 'salida') {
            folio_vale = await movimientoModel.generarFolioVale(client);
        }

        const fecha_autorizacion = autorizado_por ? new Date() : null;
        const tipoParaStock      = tipo_movimiento === 'entrada' ? 'entrada' : 'salida';

        const movimiento = await movimientoModel.registrar(client, {
            fk_articulo, tipo_movimiento,
            cantidad:         parseInt(cantidad),
            motivo,
            registrado_por:   req.user.id,
            entregado_por:    req.user.id,
            recibido_por:     recibido_por     || null,
            fk_area:          fk_area          || null,
            referencia:       referencia       || null,
            numero_factura:   numero_factura   || null,
            fecha_factura:    fecha_factura    || null, 
            folio_memorandum: folio_memorandum || null,
            folio_vale,
            autorizado_por:   autorizado_por   || null,
            fecha_autorizacion,
            archivo_factura:  archivo_factura  || null,
            archivo_acta:     archivo_acta     || null,
            tipo_baja:       tipo_baja         || null
        });

        const nuevoStock = await articuloModel.actualizarStock(
            client, fk_articulo, parseInt(cantidad), tipoParaStock
        );

        await client.query('COMMIT');

        res.json({
            mensaje:           'Movimiento registrado exitosamente',
            data:              movimiento.rows[0],
            folio_vale,
            stock_actualizado: nuevoStock.rows[0].stock
        });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

// ============================================
// Historial por artículo
// ============================================
exports.historialPorArticulo = async (req, res) => {
    try {
        const data = await movimientoModel.historialPorArticulo(req.params.id);
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Historial general
// ============================================
exports.historialGeneral = async (req, res) => {
    try {
        const { tipo, fecha_inicio, fecha_fin } = req.query;
        const data = await movimientoModel.historialGeneral({ tipo, fecha_inicio, fecha_fin });
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Historial por empleado
exports.historialPorEmpleado = async (req, res) => {
    try {
        const { anio, fk_area } = req.query;
        const data = await movimientoModel.historialPorEmpleado(req.params.id, { anio, fk_area });
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};