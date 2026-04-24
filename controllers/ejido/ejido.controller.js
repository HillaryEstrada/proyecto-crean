// ============================================
// CONTROLADOR: ejido.controller.js
// Descripción: Lógica de negocio para ejido
// ============================================

const ejido = require('../../models/ejido/ejido.model');

// ============================================
// Crear ejido
// ============================================
exports.crear = async (req, res) => {
    try {
        const resultado = await ejido.crear({
            ...req.body,
            registrado_por: req.user.id
        });
        res.json({ mensaje: 'Ejido creado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar ejidos activos
// ============================================
exports.listar = async (req, res) => {
    try {
        const data = await ejido.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar todos los ejidos (activos e inactivos)
// ============================================
exports.listarTodos = async (req, res) => {
    try {
        const data = await ejido.listarTodos();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar ejidos inactivos
// ============================================
exports.listarInactivos = async (req, res) => {
    try {
        const data = await ejido.listarInactivos();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Obtener ejido por ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await ejido.obtenerPorId(req.params.id);
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Ejido no encontrado' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Actualizar ejido
// ============================================
exports.actualizar = async (req, res) => {
    try {
        const resultado = await ejido.actualizar(req.params.id, req.body);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Ejido no encontrado' });
        }
        res.json({ mensaje: 'Ejido actualizado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Desactivar ejido (baja lógica)
// ============================================
exports.desactivar = async (req, res) => {
    try {
        const resultado = await ejido.desactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Ejido no encontrado' });
        }
        res.json({ mensaje: 'Ejido desactivado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Reactivar ejido
// ============================================
exports.reactivar = async (req, res) => {
    try {
        const resultado = await ejido.reactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Ejido no encontrado' });
        }
        res.json({ mensaje: 'Ejido reactivado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};