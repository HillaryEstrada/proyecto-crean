// ============================================
// CONTROLADOR: movimiento_mobiliario.controller.js
// ============================================

const movimientoModel = require('../../models/mobiliario/movimiento_mobiliario.model');

// ============================================
// Historial por mueble
// ============================================
exports.historialPorMobiliario = async (req, res) => {
    try {
        const data = await movimientoModel.historialPorMobiliario(req.params.id);
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Historial general
// ============================================
exports.historialGeneral = async (req, res) => {
    try {
        const { tipo, fecha_inicio, fecha_fin } = req.query;
        const data = await movimientoModel.historialGeneral({ tipo, fecha_inicio, fecha_fin });
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};