// ============================================
// CONTROLADOR: tipo_contrato.controller.js
// Descripción: CRUD de tipos de contrato
// ============================================

const TipoContrato = require('../../models/auth/tipo_contrato.model');

// LISTAR - Todos los tipos de contrato
exports.listar = async (req, res) => {
    try {
        const data = await TipoContrato.listar();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar tipos de contrato:', error);
        res.status(500).json({ error: error.message });
    }
};

// OBTENER - Tipo de contrato por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await TipoContrato.obtenerPorId(req.params.id);
        if (data.rows.length === 0) {
            return res.status(404).json({ error: 'Tipo de contrato no encontrado' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        console.error('Error al obtener tipo de contrato:', error);
        res.status(500).json({ error: error.message });
    }
};

// CREAR - Nuevo tipo de contrato
exports.crear = async (req, res) => {
    try {
        const { nombre } = req.body;

        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre del tipo de contrato es requerido' });
        }

        const existe = await TipoContrato.existeNombre(nombre.trim());
        if (existe.rows.length > 0) {
            return res.status(400).json({ error: 'Ya existe un tipo de contrato con ese nombre' });
        }

        const result = await TipoContrato.crear(nombre.trim());
        res.json({
            mensaje: 'Tipo de contrato creado exitosamente',
            id: result.rows[0].pk_tipo_contrato
        });

    } catch (error) {
        console.error('Error al crear tipo de contrato:', error);
        res.status(500).json({ error: error.message });
    }
};

// ACTUALIZAR - Tipo de contrato existente
exports.actualizar = async (req, res) => {
    try {
        const { nombre } = req.body;

        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre del tipo de contrato es requerido' });
        }

        const existe = await TipoContrato.obtenerPorId(req.params.id);
        if (existe.rows.length === 0) {
            return res.status(404).json({ error: 'Tipo de contrato no encontrado' });
        }

        const duplicado = await TipoContrato.existeNombre(nombre.trim(), req.params.id);
        if (duplicado.rows.length > 0) {
            return res.status(400).json({ error: 'Ya existe un tipo de contrato con ese nombre' });
        }

        await TipoContrato.actualizar(req.params.id, nombre.trim());
        res.json({ mensaje: 'Tipo de contrato actualizado exitosamente' });

    } catch (error) {
        console.error('Error al actualizar tipo de contrato:', error);
        res.status(500).json({ error: error.message });
    }
};

// ELIMINAR - Tipo de contrato (con validación de uso)
exports.eliminar = async (req, res) => {
    try {
        const existe = await TipoContrato.obtenerPorId(req.params.id);
        if (existe.rows.length === 0) {
            return res.status(404).json({ error: 'Tipo de contrato no encontrado' });
        }

        const enUso = await TipoContrato.tieneContratos(req.params.id);
        if (enUso.rows.length > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar: el tipo de contrato está asignado a uno o más empleados'
            });
        }

        await TipoContrato.eliminar(req.params.id);
        res.json({ mensaje: 'Tipo de contrato eliminado exitosamente' });

    } catch (error) {
        console.error('Error al eliminar tipo de contrato:', error);
        res.status(500).json({ error: error.message });
    }
};