// ============================================
// CONTROLADOR: unidad_medida.controller.js
// Descripción: Lógica de negocio para unidad de medida
// ============================================

const unidad = require('../../models/unidad_medida/unidad_medida.model');

// ============================================
// Crear unidad de medida
// ============================================
exports.crear = async (req, res) => {
    try {
        // Verificar duplicado de nombre
        const existeNombre = await unidad.existeNombre(req.body.nombre);
        if (existeNombre.rows.length) {
            return res.status(400).json({ error: 'Ya existe una unidad de medida con ese nombre' });
        }

        const resultado = await unidad.crear({ ...req.body, registrado_por: req.user.id });
        res.json({ mensaje: 'Unidad de medida creada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar unidades activas
// ============================================
exports.listar = async (req, res) => {
    try {
        const data = await unidad.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar todas las unidades (activas e inactivas)
// ============================================
exports.listarTodos = async (req, res) => {
    try {
        const data = await unidad.listarTodos();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar unidades inactivas
// ============================================
exports.listarInactivos = async (req, res) => {
    try {
        const data = await unidad.listarInactivos();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Obtener unidad por ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await unidad.obtenerPorId(req.params.id);
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Unidad de medida no encontrada' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Actualizar unidad de medida
// ============================================
exports.actualizar = async (req, res) => {
    try {
        // Verificar duplicado de nombre (excluyendo la actual)
        if (req.body.nombre) {
            const existeNombre = await unidad.existeNombre(req.body.nombre, req.params.id);
            if (existeNombre.rows.length) {
                return res.status(400).json({ error: 'Ya existe una unidad de medida con ese nombre' });
            }
        }

        const resultado = await unidad.actualizar(req.params.id, req.body);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Unidad de medida no encontrada' });
        }
        res.json({ mensaje: 'Unidad de medida actualizada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Desactivar unidad (baja lógica)
// ============================================
exports.desactivar = async (req, res) => {
    try {
        const resultado = await unidad.desactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Unidad de medida no encontrada' });
        }
        res.json({ mensaje: 'Unidad de medida desactivada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Reactivar unidad
// ============================================
exports.reactivar = async (req, res) => {
    try {
        const resultado = await unidad.reactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Unidad de medida no encontrada' });
        }
        res.json({ mensaje: 'Unidad de medida reactivada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};