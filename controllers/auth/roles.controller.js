// ============================================
// CONTROLADOR: roles.controller.js
// Descripción: Manejo de roles del sistema
// ============================================

const Rol = require('../../models/auth/roles.model');

// LISTAR - Todos los roles activos
exports.listar = async (req, res) => {
    try {
        const data = await Rol.listar();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar roles:', error);
        res.status(500).json({ error: error.message });
    }
};

// LISTAR TODOS - Activos e inactivos
exports.listarTodos = async (req, res) => {
    try {
        const data = await Rol.listarTodos();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar todos los roles:', error);
        res.status(500).json({ error: error.message });
    }
};

// OBTENER - Rol por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await Rol.obtenerPorId(req.params.id);
        if (data.rows.length === 0) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        console.error('Error al obtener rol:', error);
        res.status(500).json({ error: error.message });
    }
};

// CREAR - Nuevo rol
exports.crear = async (req, res) => {
    try {
        const resultado = await Rol.crear(req.body);
        res.json({ mensaje: 'Rol creado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        console.error('Error al crear rol:', error);
        res.status(500).json({ error: error.message });
    }
};

// ACTUALIZAR - Rol existente
exports.actualizar = async (req, res) => {
    try {
        const resultado = await Rol.actualizar(req.params.id, req.body);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }
        res.json({ mensaje: 'Rol actualizado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        console.error('Error al actualizar rol:', error);
        res.status(500).json({ error: error.message });
    }
};

// DESACTIVAR - Baja lógica
exports.desactivar = async (req, res) => {
    try {
        const resultado = await Rol.desactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }
        res.json({ mensaje: 'Rol desactivado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        console.error('Error al desactivar rol:', error);
        res.status(500).json({ error: error.message });
    }
};

// ACTIVAR - Reactivar rol
exports.activar = async (req, res) => {
    try {
        const resultado = await Rol.activar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }
        res.json({ mensaje: 'Rol activado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        console.error('Error al activar rol:', error);
        res.status(500).json({ error: error.message });
    }
};