// ============================================
// CONTROLADOR: maquinaria.controller.js
// Descripción: Maneja la lógica de negocio para maquinaria
// ============================================

const Maquinaria = require('../../models/maquinaria/maquinaria.model');

// ============================================
// CREAR MAQUINARIA
// registrado_por viene del JWT (req.user.id)
// ============================================
exports.crear = async (req, res) => {
    try {
        const resultado = await Maquinaria.crear({
            ...req.body,
            registrado_por: req.user.id
        });
        res.json({
            mensaje: 'Maquinaria creada exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al crear maquinaria:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// LISTAR MAQUINARIA ACTIVA
// ============================================
exports.listar = async (req, res) => {
    try {
        const data = await Maquinaria.listar();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar maquinaria:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// OBTENER MAQUINARIA POR ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await Maquinaria.obtenerPorId(req.params.id);
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Maquinaria no encontrada' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        console.error('Error al obtener maquinaria:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// ACTUALIZAR MAQUINARIA
// ============================================
exports.actualizar = async (req, res) => {
    try {
        const resultado = await Maquinaria.actualizar(req.params.id, req.body);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Maquinaria no encontrada' });
        }
        res.json({
            mensaje: 'Maquinaria actualizada exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar maquinaria:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// DESACTIVAR — BAJA LÓGICA
// Cambia estado_operativo a 'baja'
// ============================================
exports.desactivar = async (req, res) => {
    try {
        const resultado = await Maquinaria.desactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Maquinaria no encontrada' });
        }
        res.json({
            mensaje: 'Maquinaria dada de baja exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al desactivar maquinaria:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// LISTAR MAQUINARIA DADA DE BAJA
// ============================================
exports.listarBajas = async (req, res) => {
    try {
        const data = await Maquinaria.listarBajas();
        res.json(data.rows);
    } catch (error) {
        console.error('Error en listarBajas:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// REGISTRAR BAJA EN HISTORIAL
// registrado_por viene del JWT
// ============================================
exports.registrarBaja = async (req, res) => {
    try {
        const resultado = await Maquinaria.registrarBaja({
            ...req.body,
            registrado_por: req.user.id
        });
        res.json({
            mensaje: 'Baja registrada exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al registrar baja:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// LISTAR HISTORIAL DE BAJAS REGISTRADAS
// ============================================
exports.listarBajasRegistradas = async (req, res) => {
    try {
        const data = await Maquinaria.listarBajasRegistradas();
        res.json(data.rows);
    } catch (error) {
        console.error('Error en listarBajasRegistradas:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// OBTENER BAJA POR ID
// ============================================
exports.obtenerBajaPorId = async (req, res) => {
    try {
        const data = await Maquinaria.obtenerBajaPorId(req.params.id);
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Baja no encontrada' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        console.error('Error al obtener baja:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// ACTUALIZAR BAJA
// ============================================
exports.actualizarBaja = async (req, res) => {
    try {
        const resultado = await Maquinaria.actualizarBaja(req.params.id, req.body);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Baja no encontrada' });
        }
        res.json({
            mensaje: 'Baja actualizada exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar baja:', error);
        res.status(500).json({ error: error.message });
    }
};