// ============================================
// CONTROLADOR: checklist.controller.js
// Descripción: Maneja la lógica de negocio para checklist diario
// ============================================

const checklist = require('../../models/checklist/checklist.model');


// Crear un nuevo checklist
exports.crear = async (req, res) => {
    try {
        await checklist.crear(req.body);
        res.json({ mensaje: 'Checklist registrado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Listar todos los checklist
exports.listar = async (req, res) => {
    try {
        const data = await checklist.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Obtener checklist por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await checklist.obtenerPorId(req.params.id);
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener checklist por maquinaria
exports.obtenerPorMaquinaria = async (req, res) => {
    try {
        const data = await checklist.obtenerPorMaquinaria(req.params.id);
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar checklist
exports.actualizar = async (req, res) => {
    try {
        await checklist.actualizar(req.params.id, req.body);
        res.json({ mensaje: 'Checklist actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Eliminar checklist (si decides permitirlo)
exports.eliminar = async (req, res) => {
    try {
        await checklist.eliminar(req.params.id);
        res.json({ mensaje: 'Checklist eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};