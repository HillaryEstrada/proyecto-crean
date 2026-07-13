// ============================================
// CONTROLADOR: devolucion.controller.js
// ============================================

const devolucion = require('../../models/devolucion/devolucion.model');


// Listar devoluciones
exports.listar = async (req, res) => {
    try {
        const data = await devolucion.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Obtener devolución por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await devolucion.obtenerPorId(req.params.id);
        if (!data.rows.length)
            return res.status(404).json({ error: 'Devolución no encontrada' });
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Crear devolución
exports.crear = async (req, res) => {
    try {
        const resultado = await devolucion.crear({
            ...req.body,
            registrado_por: req.user.id
        });
        res.status(201).json({ 
            mensaje: 'Devolución registrada correctamente', 
            data: resultado.rows[0] 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Eliminar devolución
exports.eliminar = async (req, res) => {
    try {
        const resultado = await devolucion.eliminar(req.params.id);
        if (!resultado.rows.length)
            return res.status(404).json({ error: 'Devolución no encontrada' });
        res.json({ mensaje: 'Devolución eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};