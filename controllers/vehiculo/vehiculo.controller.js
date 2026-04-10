// ============================================
// CONTROLADOR: vehiculo.controller.js
// Descripción: Maneja la lógica de negocio para vehiculo
// ============================================

const vehiculo = require('../../models/vehiculo/vehiculo.model'); // Importa el modelo de vehiculo

// Crear un nuevo vehiculo
exports.crear = async (req, res) => {
    try {
        await vehiculo.crear(req.body);
        res.json({ mensaje: 'vehiculo creado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Listar todos los vehiculo activos
exports.listar = async (req, res) => {
    try {
        const data = await vehiculo.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener un vehiculo por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await vehiculo.obtenerPorId(req.params.id);
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar vehiculo
exports.actualizar = async (req, res) => {
    try {
        await vehiculo.actualizar(req.params.id, req.body);
        res.json({ mensaje: 'vehiculo actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Desactivar vehiculo (soft delete)
exports.desactivar = async (req, res) => {
    try {
        await vehiculo.desactivar(req.params.id);
        res.json({ mensaje: 'vehiculo desactivado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar vehiculo permanentemente (hard delete)
exports.desaparecer = async (req, res) => {
    try {
        await vehiculo.desaparecer(req.params.id);
        res.json({ mensaje: 'vehiculo eliminado permanentemente' });
    } catch (error) {
        res.status(500).json({ error: 'No se puede eliminar el vehiculo' });
    }
};