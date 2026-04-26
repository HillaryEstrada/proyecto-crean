// ============================================
// CONTROLADOR: area.controller.js
// Descripción: Lógica de negocio para area
// ============================================

const area = require('../../models/area/area.model');

// ============================================
// Crear area
// ============================================
exports.crear = async (req, res) => {
    try {
        // Verificar duplicado de nombre
        const existeNombre = await area.existeNombre(req.body.nombre);
        if (existeNombre.rows.length) {
            return res.status(400).json({ error: 'Ya existe un área con ese nombre' });
        }

        const resultado = await area.crear({ ...req.body, registrado_por: req.user.id });
        res.json({ mensaje: 'Área creada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar areas activas
// ============================================
exports.listar = async (req, res) => {
    try {
        const data = await area.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar todas las areas (activas e inactivas)
// ============================================
exports.listarTodos = async (req, res) => {
    try {
        const data = await area.listarTodos();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar areas inactivas
// ============================================
exports.listarInactivos = async (req, res) => {
    try {
        const data = await area.listarInactivos();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Obtener area por ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await area.obtenerPorId(req.params.id);
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Área no encontrada' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Actualizar area
// ============================================
exports.actualizar = async (req, res) => {
    try {
        // Verificar duplicado de nombre (excluyendo la actual)
        if (req.body.nombre) {
            const existeNombre = await area.existeNombre(req.body.nombre, req.params.id);
            if (existeNombre.rows.length) {
                return res.status(400).json({ error: 'Ya existe un área con ese nombre' });
            }
        }

        const resultado = await area.actualizar(req.params.id, req.body);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Área no encontrada' });
        }
        res.json({ mensaje: 'Área actualizada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Desactivar area (baja lógica)
// ============================================
exports.desactivar = async (req, res) => {
    try {
        const resultado = await area.desactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Área no encontrada' });
        }
        res.json({ mensaje: 'Área desactivada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Reactivar area
// ============================================
exports.reactivar = async (req, res) => {
    try {
        const resultado = await area.reactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Área no encontrada' });
        }
        res.json({ mensaje: 'Área reactivada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};