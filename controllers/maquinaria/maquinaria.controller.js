// ============================================
// CONTROLADOR: maquinaria.controller.js
// Descripción: Maneja la lógica de negocio para maquinaria
// ============================================

const maquinaria = require('../../models/maquinaria/maquinaria.model');

// ============================================
// CONTROLADOR: CREAR MAQUINARIA
// ============================================
exports.crear = async (req, res) => {
    try {
        const resultado = await maquinaria.crear(req.body);
        res.json({
            mensaje: 'Maquinaria creada exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: LISTAR MAQUINARIA ACTIVA
// ============================================
exports.listar = async (req, res) => {
    try {
        const data = await maquinaria.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: OBTENER MAQUINARIA POR ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await maquinaria.obtenerPorId(req.params.id);

        if (!data.rows.length) {
            return res.status(404).json({ error: 'Maquinaria no encontrada' });
        }

        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: ACTUALIZAR MAQUINARIA
// ============================================
exports.actualizar = async (req, res) => {
    try {
        const resultado = await maquinaria.actualizar(req.params.id, req.body);

        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Maquinaria no encontrada' });
        }

        res.json({
            mensaje: 'Maquinaria actualizada exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: DESACTIVAR (BAJA LÓGICA)
// ============================================
exports.desactivar = async (req, res) => {
    try {
        const resultado = await maquinaria.desactivar(req.params.id);

        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Maquinaria no encontrada' });
        }

        res.json({
            mensaje: 'Maquinaria dada de baja exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: LISTAR MAQUINARIA DADA DE BAJA
// ============================================
exports.listarBajas = async (req, res) => {
    try {
        const data = await maquinaria.listarBajas();
        res.json(data.rows);
    } catch (error) {
        console.error('Error en listarBajas:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: REGISTRAR BAJA EN HISTORIAL
// ============================================
exports.registrarBaja = async (req, res) => {
    try {
        const resultado = await maquinaria.registrarBaja(req.body);
        res.json({
            mensaje: 'Baja registrada exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: LISTAR HISTORIAL DE BAJAS
// ============================================
exports.listarBajasRegistradas = async (req, res) => {
    try {
        const data = await maquinaria.listarBajasRegistradas();
        res.json(data.rows);
    } catch (error) {
        console.error('Error en listarBajasRegistradas:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: OBTENER BAJA POR ID (pk_baja)
// ============================================
exports.obtenerBajaPorId = async (req, res) => {
    try {
        const data = await maquinaria.obtenerBajaPorId(req.params.id);

        if (!data.rows.length) {
            return res.status(404).json({ error: 'Baja no encontrada' });
        }

        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};