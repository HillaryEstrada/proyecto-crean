// ============================================
// CONTROLADOR: movimiento_bodega.controller.js
// Descripción: Lógica de negocio para movimientos de bodega
// ============================================

const Movimiento = require('../../models/movimiento_bodega/movimiento_bodega.model');

// ============================================
// HELPER: validar payload
// ============================================
function validarPayload(body) {
    const { tipo_movimiento, fk_bodega, detalles } = body;
    if (!tipo_movimiento || !fk_bodega)
        return 'Tipo de movimiento y bodega son requeridos';
    if (!Array.isArray(detalles) || detalles.length === 0)
        return 'El movimiento debe tener al menos un producto';
    for (const d of detalles) {
        if (!d.fk_producto || !d.cantidad_kg || parseFloat(d.cantidad_kg) <= 0)
            return 'Cada detalle debe tener producto y cantidad mayor a 0';
    }
    return null;
}

// ============================================
// CREAR MOVIMIENTO
// ============================================
exports.crearMovimiento = async (req, res) => {
    try {
        const errMsg = validarPayload(req.body);
        if (errMsg) return res.status(400).json({ error: errMsg });

        const resultado = await Movimiento.crearMovimiento({
            ...req.body,
            registrado_por: req.user.id
        });

        res.json({ mensaje: 'Movimiento registrado exitosamente', data: resultado });

    } catch (error) {
        console.error('Error al crear movimiento:', error);
        if (error.tipo === 'stock_insuficiente')
            return res.status(400).json({ error: 'Stock insuficiente para uno o más productos' });
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// ACTUALIZAR MOVIMIENTO
// ============================================
exports.actualizarMovimiento = async (req, res) => {
    try {
        const errMsg = validarPayload(req.body);
        if (errMsg) return res.status(400).json({ error: errMsg });

        const resultado = await Movimiento.actualizarMovimiento(req.params.id, req.body);

        res.json({ mensaje: 'Movimiento actualizado exitosamente', data: resultado });

    } catch (error) {
        console.error('Error al actualizar movimiento:', error);
        if (error.tipo === 'no_encontrado')
            return res.status(404).json({ error: 'Movimiento no encontrado' });
        if (error.tipo === 'stock_insuficiente')
            return res.status(400).json({ error: 'Stock insuficiente para uno o más productos' });
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// ELIMINAR MOVIMIENTO (revierte inventario)
// ============================================
exports.eliminarMovimiento = async (req, res) => {
    try {
        await Movimiento.eliminarMovimiento(req.params.id);
        res.json({ mensaje: 'Movimiento eliminado y stock revertido exitosamente' });
    } catch (error) {
        console.error('Error al eliminar movimiento:', error);
        if (error.tipo === 'no_encontrado')
            return res.status(404).json({ error: 'Movimiento no encontrado' });
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// LISTAR MOVIMIENTOS
// ============================================
exports.listar = async (req, res) => {
    try {
        const data = await Movimiento.listar();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar movimientos:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// OBTENER MOVIMIENTO CON DETALLE
// ============================================
exports.obtenerDetalle = async (req, res) => {
    try {
        const movimiento = await Movimiento.obtenerPorId(req.params.id);
        if (!movimiento.rows.length)
            return res.status(404).json({ error: 'Movimiento no encontrado' });

        const detalle = await Movimiento.obtenerDetalle(req.params.id);

        res.json({ movimiento: movimiento.rows[0], detalles: detalle.rows });

    } catch (error) {
        console.error('Error al obtener movimiento:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// HISTORIAL POR PRODUCTO + BODEGA
// ============================================
exports.historialPorProducto = async (req, res) => {
    try {
        const { fk_producto, fk_bodega } = req.params;
        const data = await Movimiento.historialPorProducto(fk_producto, fk_bodega);
        res.json(data.rows);
    } catch (error) {
        console.error('Error historial producto:', error);
        res.status(500).json({ error: error.message });
    }
};