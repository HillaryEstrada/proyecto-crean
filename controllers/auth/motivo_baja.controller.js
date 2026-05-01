// ============================================
// CONTROLADOR: motivoBaja.controller.js
// Descripción: CRUD de motivos de baja
// ============================================

const MotivoBaja = require('../../models/auth/motivo_baja.model');

// LISTAR - Todos los motivos de baja
exports.listar = async (req, res) => {
    try {
        const data = await MotivoBaja.listar();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar motivos de baja:', error);
        res.status(500).json({ error: error.message });
    }
};

// OBTENER - Motivo de baja por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await MotivoBaja.obtenerPorId(req.params.id);
        if (data.rows.length === 0) {
            return res.status(404).json({ error: 'Motivo de baja no encontrado' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        console.error('Error al obtener motivo de baja:', error);
        res.status(500).json({ error: error.message });
    }
};

// CREAR - Nuevo motivo de baja
exports.crear = async (req, res) => {
    try {
        const { nombre } = req.body;

        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre del motivo de baja es requerido' });
        }

        const existe = await MotivoBaja.existeNombre(nombre.trim());
        if (existe.rows.length > 0) {
            return res.status(400).json({ error: 'Ya existe un motivo de baja con ese nombre' });
        }

        const result = await MotivoBaja.crear(nombre.trim());
        res.json({
            mensaje: 'Motivo de baja creado exitosamente',
            id: result.rows[0].pk_motivo_baja
        });

    } catch (error) {
        console.error('Error al crear motivo de baja:', error);
        res.status(500).json({ error: error.message });
    }
};

// ACTUALIZAR - Motivo de baja existente
exports.actualizar = async (req, res) => {
    try {
        const { nombre } = req.body;

        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre del motivo de baja es requerido' });
        }

        const existe = await MotivoBaja.obtenerPorId(req.params.id);
        if (existe.rows.length === 0) {
            return res.status(404).json({ error: 'Motivo de baja no encontrado' });
        }

        const duplicado = await MotivoBaja.existeNombre(nombre.trim(), req.params.id);
        if (duplicado.rows.length > 0) {
            return res.status(400).json({ error: 'Ya existe un motivo de baja con ese nombre' });
        }

        await MotivoBaja.actualizar(req.params.id, nombre.trim());
        res.json({ mensaje: 'Motivo de baja actualizado exitosamente' });

    } catch (error) {
        console.error('Error al actualizar motivo de baja:', error);
        res.status(500).json({ error: error.message });
    }
};

// ELIMINAR - Motivo de baja (con validación de uso)
exports.eliminar = async (req, res) => {
    try {
        const existe = await MotivoBaja.obtenerPorId(req.params.id);
        if (existe.rows.length === 0) {
            return res.status(404).json({ error: 'Motivo de baja no encontrado' });
        }

        const enUso = await MotivoBaja.estaEnUso(req.params.id);
        if (enUso.rows.length > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar: el motivo está asignado a uno o más empleados'
            });
        }

        await MotivoBaja.eliminar(req.params.id);
        res.json({ mensaje: 'Motivo de baja eliminado exitosamente' });

    } catch (error) {
        console.error('Error al eliminar motivo de baja:', error);
        res.status(500).json({ error: error.message });
    }
};