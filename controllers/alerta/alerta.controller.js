// ============================================
// CONTROLADOR: alerta.controller.js
// Descripción: Maneja los endpoints del módulo de alertas
// ============================================

const alerta = require('../../models/alerta/alerta.model');
const alertaService = require('../../services/alerta/alerta.service');

// ============================================
// CONTROLADOR: LISTAR TODAS LAS ALERTAS
// ============================================
exports.listar = async (req, res) => {
    try {
        const data = await alerta.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: LISTAR ALERTAS PENDIENTES
// ============================================
exports.listarPendientes = async (req, res) => {
    try {
        const data = await alerta.listarPendientes();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: LISTAR ALERTAS POR MAQUINARIA
// ============================================
exports.listarPorMaquinaria = async (req, res) => {
    try {
        const data = await alerta.listarPorMaquinaria(req.params.id);
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: LISTAR ALERTAS POR VEHÍCULO
// ============================================
exports.listarPorVehiculo = async (req, res) => {
    try {
        const data = await alerta.listarPorVehiculo(req.params.id);
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: CONTAR PENDIENTES (badge)
// ============================================
exports.contarPendientes = async (req, res) => {
    try {
        const data = await alerta.contarPendientes();
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: MARCAR ALERTA COMO LEÍDA
// ============================================
exports.marcarLeida = async (req, res) => {
    try {
        const resultado = await alerta.marcarLeida(req.params.id);

        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Alerta no encontrada' });
        }

        res.json({
            mensaje: 'Alerta marcada como leída',
            data: resultado.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: MARCAR TODAS LEÍDAS (maquinaria)
// ============================================
exports.marcarTodasLeidasMaquinaria = async (req, res) => {
    try {
        const resultado = await alerta.marcarTodasLeidasMaquinaria(req.params.id);
        res.json({
            mensaje: `${resultado.rowCount} alertas marcadas como leídas`,
            data: resultado.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: MARCAR TODAS LEÍDAS (vehículo)
// ============================================
exports.marcarTodasLeidasVehiculo = async (req, res) => {
    try {
        const resultado = await alerta.marcarTodasLeidasVehiculo(req.params.id);
        res.json({
            mensaje: `${resultado.rowCount} alertas marcadas como leídas`,
            data: resultado.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: EJECUTAR EVALUACIÓN MANUAL
// (útil para pruebas o triggers manuales)
// ============================================
exports.ejecutarEvaluacion = async (req, res) => {
    try {
        await alertaService.ejecutarTodasLasAlertas();
        res.json({ mensaje: 'Evaluación de alertas ejecutada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};