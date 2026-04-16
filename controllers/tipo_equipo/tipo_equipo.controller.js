// ============================================
// CONTROLADOR: tipo_equipo.controller.js
// Descripción: Maneja la lógica de negocio para tipo de equipo
// ============================================

const tipoEquipo = require('../../models/tipo_equipo/tipo_equipo.model');


// Crear un nuevo tipo de equipo
exports.crear = async (req, res) => {
    try {
        const resultado = await tipoEquipo.crear(req.body);
        res.json({ mensaje: 'Tipo de equipo creado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Listar todos los tipos de equipo activos
exports.listar = async (req, res) => {
    try {
        const data = await tipoEquipo.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Listar todos (activos e inactivos)
exports.listarTodos = async (req, res) => {
    try {
        const data = await tipoEquipo.listarTodos();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Obtener tipo de equipo por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await tipoEquipo.obtenerPorId(req.params.id);
        
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Tipo de equipo no encontrado' });
        }
        
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Actualizar tipo de equipo
exports.actualizar = async (req, res) => {
    try {
        const resultado = await tipoEquipo.actualizar(req.params.id, req.body);
        
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Tipo de equipo no encontrado' });
        }
        
        res.json({ mensaje: 'Tipo de equipo actualizado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};