// ============================================
// CONTROLADOR: garantia.controller.js
// Descripción: Maneja la lógica de negocio para garantía
// ============================================

const garantia = require('../../models/garantia/garantia.model');


// Crear una nueva garantía
exports.crear = async (req, res) => {
    try {
        const resultado = await garantia.crear(req.body);
        res.json({ mensaje: 'Garantía creada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Listar garantías activas
exports.listar = async (req, res) => {
    try {
        const data = await garantia.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Listar todas (activas e inactivas)
exports.listarTodas = async (req, res) => {
    try {
        const data = await garantia.listarTodas();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Obtener garantía por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await garantia.obtenerPorId(req.params.id);
        
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Garantía no encontrada' });
        }
        
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Actualizar garantía
exports.actualizar = async (req, res) => {
    try {
        const resultado = await garantia.actualizar(req.params.id, req.body);
        
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Garantía no encontrada' });
        }
        
        res.json({ mensaje: 'Garantía actualizada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Desactivar garantía (caducada)
exports.desactivar = async (req, res) => {
    try {
        const resultado = await garantia.desactivar(req.params.id);
        
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Garantía no encontrada' });
        }
        
        res.json({ mensaje: 'Garantía desactivada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Activar garantía
exports.activar = async (req, res) => {
       try {
        const resultado = await garantia.activar(req.params.id);
        
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Garantía no encontrada' });
        }
        
        res.json({ mensaje: 'Garantía activada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};