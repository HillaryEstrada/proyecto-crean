// ============================================
// CONTROLADOR: ubicacion.controller.js
// Descripción: Maneja la lógica de negocio para ubicación
// ============================================

const ubicacion = require('../../models/ubicacion/ubicacion.model');


// Crear una nueva ubicación
exports.crear = async (req, res) => {
    try {
        const resultado = await ubicacion.crear(req.body);
        res.json({ mensaje: 'Ubicación creada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Listar ubicaciones activas
exports.listar = async (req, res) => {
    try {
        const data = await ubicacion.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Listar todas (activas e inactivas)
exports.listarTodas = async (req, res) => {
    try {
        const data = await ubicacion.listarTodas();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Obtener ubicación por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await ubicacion.obtenerPorId(req.params.id);
        
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Ubicación no encontrada' });
        }
        
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Actualizar ubicación
exports.actualizar = async (req, res) => {
    try {
        const resultado = await ubicacion.actualizar(req.params.id, req.body);
        
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Ubicación no encontrada' });
        }
        
        res.json({ mensaje: 'Ubicación actualizada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};