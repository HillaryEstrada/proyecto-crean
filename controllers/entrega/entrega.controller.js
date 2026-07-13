// ============================================
// CONTROLADOR: entrega.controller.js
// ============================================

const entrega = require('../../models/entrega/entrega.model');


// Listar entregas
exports.listar = async (req, res) => {
    try {
        const data = await entrega.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Obtener entrega por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await entrega.obtenerPorId(req.params.id);
        if (!data.rows.length)
            return res.status(404).json({ error: 'Entrega no encontrada' });
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Crear entrega
exports.crear = async (req, res) => {
    try {
        const resultado = await entrega.crear({
            ...req.body,
            registrado_por: req.user.id
        });
        res.status(201).json({ 
            mensaje: 'Entrega registrada correctamente', 
            data: resultado.rows[0] 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Eliminar entrega
exports.eliminar = async (req, res) => {
    try {
        const resultado = await entrega.eliminar(req.params.id);
        if (!resultado.rows.length)
            return res.status(404).json({ error: 'Entrega no encontrada' });
        res.json({ mensaje: 'Entrega eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};