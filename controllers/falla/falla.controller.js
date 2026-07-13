// ============================================
// CONTROLADOR: falla.controller.js
// ============================================

const falla = require('../../models/falla/falla.model');


// Listar fallas
exports.listar = async (req, res) => {
    try {
        const { estado } = req.query;
        let data;

        if (estado) {
            data = await falla.listarPorEstado(estado);
        } else {
            data = await falla.listar();
        }

        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Obtener falla por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await falla.obtenerPorId(req.params.id);
        if (!data.rows.length)
            return res.status(404).json({ error: 'Falla no encontrada' });
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Crear falla
exports.crear = async (req, res) => {
    try {
        const resultado = await falla.crear({
            ...req.body,
            registrado_por: req.user.id
        });
        res.status(201).json({ 
            mensaje: 'Falla reportada correctamente', 
            data: resultado.rows[0] 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Cambiar estado de falla
exports.cambiarEstado = async (req, res) => {
    const { estado } = req.body;

    if (!estado) return res.status(400).json({ error: 'El estado es obligatorio' });

    try {
        const resultado = await falla.cambiarEstado(req.params.id, estado, req.user.id);
        if (!resultado.rows.length)
            return res.status(404).json({ error: 'Falla no encontrada' });
        res.json({ 
            mensaje: 'Estado de falla actualizado', 
            data: resultado.rows[0] 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Eliminar falla
exports.eliminar = async (req, res) => {
    try {
        const resultado = await falla.eliminar(req.params.id);
        if (!resultado.rows.length)
            return res.status(404).json({ error: 'Falla no encontrada' });
        res.json({ mensaje: 'Falla eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};