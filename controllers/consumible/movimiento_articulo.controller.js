// ============================================
// CONTROLADOR: movimiento_articulo.controller.js
// Descripción: Lógica para registrar movimientos
// ============================================

const Conexion = require('../../config/database');
const movimientoModel = require('../../models/consumible/movimiento_articulo.model');
const articuloModel   = require('../../models/consumible/articulo.model');

// ============================================
// Registrar movimiento
// ============================================
exports.registrar = async (req, res) => {
    const client = await Conexion.conectar().connect();
    try {
        const {
            fk_articulo,
            tipo_movimiento,
            cantidad,
            motivo,
            entregado_por,
            recibido_por,
            fk_area,
            referencia
        } = req.body;

        // --- Validaciones generales ---
        if (!fk_articulo)     return res.status(400).json({ error: 'El artículo es obligatorio' });
        if (!tipo_movimiento) return res.status(400).json({ error: 'El tipo de movimiento es obligatorio' });
        if (!cantidad || cantidad <= 0) return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
        if (!motivo)          return res.status(400).json({ error: 'El motivo es obligatorio' });

        const tiposValidos = ['entrada', 'salida', 'baja'];
        if (!tiposValidos.includes(tipo_movimiento)) {
            return res.status(400).json({ error: 'Tipo de movimiento inválido. Use: entrada, salida o baja' });
        }

        // --- Validaciones por tipo ---
        if (tipo_movimiento === 'salida') {
            if (!fk_area)       return res.status(400).json({ error: 'El área es obligatoria para salidas' });
            if (!recibido_por)  return res.status(400).json({ error: 'El empleado que recibe es obligatorio para salidas' });
            if (!entregado_por) return res.status(400).json({ error: 'El usuario que entrega es obligatorio para salidas' });
        }

        await client.query('BEGIN');

        // --- Verificar stock actual (con FOR UPDATE para evitar concurrencia) ---
        const stockResult = await articuloModel.obtenerStock(client, fk_articulo);
        if (!stockResult.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }

        const stockActual = stockResult.rows[0].stock;

        // --- Validar stock negativo en salidas y bajas ---
        if (tipo_movimiento === 'salida' || tipo_movimiento === 'baja') {
            if (stockActual < cantidad) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: `Stock insuficiente. Stock actual: ${stockActual}, cantidad solicitada: ${cantidad}`
                });
            }
        }

        // --- Registrar movimiento ---
        const tipoParaStock = tipo_movimiento === 'entrada' ? 'entrada' : 'salida';

        const movimiento = await movimientoModel.registrar(client, {
            fk_articulo,
            tipo_movimiento,
            cantidad: parseInt(cantidad),
            motivo,
            registrado_por: req.user.id,
            entregado_por:  entregado_por  || null,
            recibido_por:   recibido_por   || null,
            fk_area:        fk_area        || null,
            referencia:     referencia     || null
        });

        // --- Actualizar stock ---
        const nuevoStock = await articuloModel.actualizarStock(client, fk_articulo, parseInt(cantidad), tipoParaStock);

        await client.query('COMMIT');

        res.json({
            mensaje: 'Movimiento registrado exitosamente',
            data: movimiento.rows[0],
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
        const { id } = req.params;
        const data = await movimientoModel.historialPorArticulo(id);
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