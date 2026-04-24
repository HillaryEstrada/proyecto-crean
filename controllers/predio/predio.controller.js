// ============================================
// CONTROLADOR: predio.controller.js
// Descripción: Lógica de negocio para predio
// ============================================

const predio = require('../../models/predio/predio.model');

// ============================================
// Crear predio
// ============================================
exports.crear = async (req, res) => {
    try {
        const resultado = await predio.crear({
            ...req.body,
            registrado_por: req.user.id
        });
        res.json({ mensaje: 'Predio creado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar predios activos
// ============================================
exports.listar = async (req, res) => {
    try {
        const data = await predio.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar todos los predios (activos e inactivos)
// ============================================
exports.listarTodos = async (req, res) => {
    try {
        const data = await predio.listarTodos();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar predios inactivos
// ============================================
exports.listarInactivos = async (req, res) => {
    try {
        const data = await predio.listarInactivos();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Obtener predio por ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await predio.obtenerPorId(req.params.id);
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Predio no encontrado' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Actualizar predio
// ============================================
exports.actualizar = async (req, res) => {
    try {
        const resultado = await predio.actualizar(req.params.id, req.body);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Predio no encontrado' });
        }
        res.json({ mensaje: 'Predio actualizado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Desactivar predio (baja lógica)
// ============================================
exports.desactivar = async (req, res) => {
    try {
        const resultado = await predio.desactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Predio no encontrado' });
        }
        res.json({ mensaje: 'Predio desactivado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Reactivar predio
// ============================================
exports.reactivar = async (req, res) => {
    try {
        const resultado = await predio.reactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Predio no encontrado' });
        }
        res.json({ mensaje: 'Predio reactivado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};