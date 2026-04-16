// ============================================
// CONTROLADOR: proveedor.controller.js
// Descripción: Maneja la lógica de negocio para proveedor
// ============================================

const proveedor = require('../../models/proveedor/proveedor.model');


// Crear un nuevo proveedor
exports.crear = async (req, res) => {
    try {
        const resultado = await proveedor.crear(req.body);
        res.json({ mensaje: 'Proveedor creado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Listar proveedores activos
exports.listar = async (req, res) => {
    try {
        const data = await proveedor.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Listar todos (activos e inactivos)
exports.listarTodos = async (req, res) => {
    try {
        const data = await proveedor.listarTodos();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Obtener proveedor por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await proveedor.obtenerPorId(req.params.id);
        
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }
        
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Actualizar proveedor
exports.actualizar = async (req, res) => {
    try {
        const resultado = await proveedor.actualizar(req.params.id, req.body);
        
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }
        
        res.json({ mensaje: 'Proveedor actualizado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};