// ============================================
// CONTROLADOR: bodega.controller.js
// Descripción: Maneja la lógica de negocio para bodega
// ============================================

const Bodega = require('../../models/bodega/bodega.model');

// ============================================
// CREAR BODEGA
// registrado_por viene del JWT (req.user.id)
// ============================================
exports.crear = async (req, res) => {
    try {
        const resultado = await Bodega.crear({
            ...req.body,
            registrado_por: req.user.id
        });
        res.json({
            mensaje: 'Bodega creada exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al crear bodega:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// LISTAR BODEGAS ACTIVAS
// ============================================
exports.listar = async (req, res) => {
    try {
        const data = await Bodega.listar();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar bodegas:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// LISTAR BODEGAS INHABILITADAS
// ============================================
exports.listarInhabilitadas = async (req, res) => {
    try {
        const data = await Bodega.listarInhabilitadas();
        res.json(data.rows);
    } catch (error) {
        console.error('Error en listarInhabilitadas:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// OBTENER BODEGA POR ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await Bodega.obtenerPorId(req.params.id);
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Bodega no encontrada' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        console.error('Error al obtener bodega:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// ACTUALIZAR BODEGA
// ============================================
exports.actualizar = async (req, res) => {
    try {
        const resultado = await Bodega.actualizar(req.params.id, req.body);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Bodega no encontrada' });
        }
        res.json({
            mensaje: 'Bodega actualizada exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar bodega:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// DESACTIVAR — BAJA LÓGICA
// Cambia estado a 'Inhabilitada'
// ============================================
exports.desactivar = async (req, res) => {
    try {
        const resultado = await Bodega.desactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Bodega no encontrada' });
        }
        res.json({
            mensaje: 'Bodega inhabilitada exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al desactivar bodega:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// REACTIVAR — Cambia estado a 'Operativo'
// ============================================
exports.reactivar = async (req, res) => {
    try {
        const resultado = await Bodega.reactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Bodega no encontrada' });
        }
        res.json({
            mensaje: 'Bodega reactivada exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al reactivar bodega:', error);
        res.status(500).json({ error: error.message });
    }
};