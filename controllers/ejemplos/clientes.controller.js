// ============================================
// CONTROLADOR: loqueseas.controller.js
// Descripción: Maneja la lógica de negocio para loqueseas
// ============================================

const loquesea = require('../../models/ejemplos/clientes.model'); // Importa el modelo de loqueseas

// Crear un nuevo loquesea
exports.crear = async (req, res) => {
    try {
        await loquesea.crear(req.body); // Inserta los datos del body
        res.json({ mensaje: 'loquesea creado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message }); // Maneja errores (ej: email duplicado)
    }
};

// Listar todos los loqueseas activos
exports.listar = async (req, res) => {
    try {
        const data = await loquesea.listar(); // Obtiene todos los loqueseas
        res.json(data.rows); // Devuelve solo las filas
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener un loquesea específico por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await loquesea.obtenerPorId(req.params.id);
        res.json(data.rows[0]); // Devuelve solo el primer registro
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar un loquesea existente
exports.actualizar = async (req, res) => {
    try {
        await loquesea.actualizar(req.params.id, req.body); // Actualiza con el ID de la URL
        res.json({ mensaje: 'loquesea actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Desactivar loquesea (soft delete)
exports.desactivar = async (req, res) => {
    try {
        await loquesea.desactivar(req.params.id);
        res.json({ mensaje: 'loquesea desactivado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar loquesea permanentemente (hard delete)
exports.desaparecer = async (req, res) => {
    try {
        await loquesea.desaparecer(req.params.id);
        res.json({ mensaje: 'loquesea eliminado permanentemente' });
    } catch (error) {
        // Si tiene pedidos asociados, PostgreSQL lanzará error por la FK RESTRICT
        res.status(500).json({ error: 'No se puede eliminar: el loquesea tiene pedidos asociados' });
    }
};