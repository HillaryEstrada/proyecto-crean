// ============================================
// CONTROLADOR: productor.controller.js
// Descripción: Maneja la lógica de negocio para productor
// ============================================

const Productor = require('../../models/productor/productor.model');

// ============================================
// CREAR PRODUCTOR
// registrado_por viene del JWT (req.user.id)
// ============================================
exports.crear = async (req, res) => {
    try {
        // Verificar si el nombre ya existe
        const existe = await Productor.existeNombre(req.body.nombre);
        if (existe.rows.length) {
            return res.status(400).json({ error: 'Ya existe un productor con ese nombre' });
        }

        const resultado = await Productor.crear({
            ...req.body,
            registrado_por: req.user.id
        });
        res.json({
            mensaje: 'Productor creado exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al crear productor:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// LISTAR PRODUCTORES ACTIVOS
// ============================================
exports.listar = async (req, res) => {
    try {
        const data = await Productor.listar();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar productores:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// LISTAR PRODUCTORES INACTIVOS
// ============================================
exports.listarInactivos = async (req, res) => {
    try {
        const data = await Productor.listarInactivos();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar productores inactivos:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// OBTENER PRODUCTOR POR ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await Productor.obtenerPorId(req.params.id);
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Productor no encontrado' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        console.error('Error al obtener productor:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// ACTUALIZAR PRODUCTOR
// ============================================
exports.actualizar = async (req, res) => {
    try {
        // Verificar nombre duplicado en otro registro
        if (req.body.nombre) {
            const existe = await Productor.existeNombre(req.body.nombre);
            const duplicado = existe.rows.find(
                row => row.pk_productor !== parseInt(req.params.id)
            );
            if (duplicado) {
                return res.status(400).json({ error: 'Ya existe un productor con ese nombre' });
            }
        }

        const resultado = await Productor.actualizar(req.params.id, req.body);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Productor no encontrado' });
        }
        res.json({
            mensaje: 'Productor actualizado exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar productor:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// DESACTIVAR — BAJA LÓGICA (estado = 0)
// ============================================
exports.desactivar = async (req, res) => {
    try {
        const resultado = await Productor.desactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Productor no encontrado' });
        }
        res.json({
            mensaje: 'Productor desactivado exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al desactivar productor:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// REACTIVAR (estado = 1)
// ============================================
exports.reactivar = async (req, res) => {
    try {
        const resultado = await Productor.reactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Productor no encontrado' });
        }
        res.json({
            mensaje: 'Productor reactivado exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al reactivar productor:', error);
        res.status(500).json({ error: error.message });
    }
};