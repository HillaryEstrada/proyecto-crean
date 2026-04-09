// ============================================
// CONTROLADOR: roles.controller.js
// Descripción: Manejo de roles del sistema
// ============================================

const Rol = require('../../models/auth/roles.model');

// LISTAR - Todos los roles
exports.listar = async (req, res) => {
    try {
        const data = await Rol.listar();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar roles:', error);
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