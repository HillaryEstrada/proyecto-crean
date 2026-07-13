// ============================================
// CONTROLADOR: mantenimiento.controller.js
// ============================================

const mantenimiento = require('../../models/mantenimiento/mantenimiento.model');


// Listar órdenes de mantenimiento
exports.listar = async (req, res) => {
    try {
        const data = await mantenimiento.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Obtener orden por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await mantenimiento.obtenerPorId(req.params.id);
        if (!data.rows.length)
            return res.status(404).json({ error: 'Orden no encontrada' });
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Crear orden de mantenimiento
exports.crear = async (req, res) => {
    try {
        const resultado = await mantenimiento.crear({
            ...req.body,
            registrado_por: req.user.id
        });
        res.status(201).json({ 
            mensaje: 'Orden de mantenimiento emitida', 
            data: resultado.rows[0] 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Terminar mantenimiento
exports.terminar = async (req, res) => {
    const { costo_real, observaciones } = req.body;

    try {
        const resultado = await mantenimiento.terminar(req.params.id, costo_real, observaciones, req.user.id);
        if (!resultado.rows.length)
            return res.status(404).json({ error: 'Orden no encontrada' });
        res.json({ 
            mensaje: 'Mantenimiento terminado. Maquinaria disponible', 
            data: resultado.rows[0] 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Eliminar orden
exports.eliminar = async (req, res) => {
    try {
        const resultado = await mantenimiento.eliminar(req.params.id);
        if (!resultado.rows.length)
            return res.status(404).json({ error: 'Orden no encontrada' });
        res.json({ mensaje: 'Orden eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};