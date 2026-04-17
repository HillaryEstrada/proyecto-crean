// ============================================
// CONTROLADOR: tipo_equipo.controller.js
// Descripción: Maneja la lógica de negocio para tipo de equipo
// ============================================

const TipoEquipo = require('../../models/tipo_equipo/tipo_equipo.model');

// ============================================
// CREAR TIPO DE EQUIPO
// registrado_por viene del JWT (req.user.id)
// ============================================
exports.crear = async (req, res) => {
    try {
        // Verificar si el nombre ya existe
        const existe = await TipoEquipo.existeNombre(req.body.nombre);
        if (existe.rows.length) {
            return res.status(400).json({ error: 'Ya existe un tipo de equipo con ese nombre' });
        }

        const resultado = await TipoEquipo.crear({
            ...req.body,
            registrado_por: req.user.id
        });
        res.json({
            mensaje: 'Tipo de equipo creado exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al crear tipo de equipo:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// LISTAR TIPOS DE EQUIPO ACTIVOS
// ============================================
exports.listar = async (req, res) => {
    try {
        const data = await TipoEquipo.listar();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar tipos de equipo:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// OBTENER TIPO DE EQUIPO POR ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await TipoEquipo.obtenerPorId(req.params.id);
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Tipo de equipo no encontrado' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        console.error('Error al obtener tipo de equipo:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// ACTUALIZAR TIPO DE EQUIPO
// ============================================
exports.actualizar = async (req, res) => {
    try {
        // Verificar si el nuevo nombre ya está en uso por otro registro
        if (req.body.nombre) {
            const existe = await TipoEquipo.existeNombre(req.body.nombre);
            const duplicado = existe.rows.find(
                row => row.pk_tipo_equipo !== parseInt(req.params.id)
            );
            if (duplicado) {
                return res.status(400).json({ error: 'Ya existe un tipo de equipo con ese nombre' });
            }
        }

        const resultado = await TipoEquipo.actualizar(req.params.id, req.body);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Tipo de equipo no encontrado' });
        }
        res.json({
            mensaje: 'Tipo de equipo actualizado exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar tipo de equipo:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// DESACTIVAR — BAJA LÓGICA
// Cambia estado a 0
// ============================================
exports.desactivar = async (req, res) => {
    try {
        const resultado = await TipoEquipo.desactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Tipo de equipo no encontrado' });
        }
        res.json({
            mensaje: 'Tipo de equipo desactivado exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al desactivar tipo de equipo:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// LISTAR TIPOS DE EQUIPO INACTIVOS
// ============================================
exports.listarInactivos = async (req, res) => {
    try {
        const data = await TipoEquipo.listarInactivos();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar tipos de equipo inactivos:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// REACTIVAR TIPO DE EQUIPO
// Cambia estado a 1
// ============================================
exports.reactivar = async (req, res) => {
    try {
        const resultado = await TipoEquipo.reactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Tipo de equipo no encontrado' });
        }
        res.json({
            mensaje: 'Tipo de equipo reactivado exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al reactivar tipo de equipo:', error);
        res.status(500).json({ error: error.message });
    }
};