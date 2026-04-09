// ============================================
// CONTROLADOR: maquinaria.controller.js
// Descripción: Maneja la lógica de negocio para maquinaria
// ============================================

const maquinaria = require('../../models/maquinaria/maquinaria.model');


// Crear una nueva maquinaria
exports.crear = async (req, res) => {
    try {
        await maquinaria.crear(req.body);
        res.json({ mensaje: 'Maquinaria creada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Listar toda la maquinaria activa
exports.listar = async (req, res) => {
    try {
        const data = await maquinaria.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Obtener maquinaria por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await maquinaria.obtenerPorId(req.params.id);
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Actualizar maquinaria
exports.actualizar = async (req, res) => {
    try {
        await maquinaria.actualizar(req.params.id, req.body);
        res.json({ mensaje: 'Maquinaria actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Baja lógica
exports.desactivar = async (req, res) => {
    try {
        await maquinaria.desactivar(req.params.id);
        res.json({ mensaje: 'Maquinaria dada de baja exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Eliminación definitiva
exports.desaparecer = async (req, res) => {
    try {
        await maquinaria.desaparecer(req.params.id);
        res.json({ mensaje: 'Maquinaria eliminada permanentemente' });
    } catch (error) {
        res.status(500).json({ error: 'No se puede eliminar la maquinaria' });
    }
};