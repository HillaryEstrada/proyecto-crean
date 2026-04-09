// ============================================
// CONTROLADOR: pedidos.controller.js
// Descripción: Maneja la lógica de negocio para pedidos
// ============================================

const Pedido = require('../../models/ejemplos/pedidos.model'); // Importa el modelo de pedidos

// Crear un nuevo pedido
exports.crear = async (req, res) => {
    try {
        await Pedido.crear(req.body); // Inserta los datos del body
        res.json({ mensaje: 'Pedido creado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message }); // Maneja errores de FK o datos inválidos
    }
};

// Listar todos los pedidos con información del cliente
exports.listar = async (req, res) => {
    try {
        const data = await Pedido.listar(); // Obtiene pedidos con JOIN a clientes
        res.json(data.rows); // Devuelve las filas con datos combinados
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener un pedido específico por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await Pedido.obtenerPorId(req.params.id);
        res.json(data.rows[0]); // Devuelve el primer registro
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar un pedido existente
exports.actualizar = async (req, res) => {
    try {
        await Pedido.actualizar(req.params.id, req.body); // Actualiza con el ID de la URL
        res.json({ mensaje: 'Pedido actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Desactivar pedido (soft delete)
exports.desactivar = async (req, res) => {
    try {
        await Pedido.desactivar(req.params.id);
        res.json({ mensaje: 'Pedido desactivado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar pedido permanentemente (hard delete)
exports.desaparecer = async (req, res) => {
    try {
        await Pedido.desaparecer(req.params.id);
        res.json({ mensaje: 'Pedido eliminado permanentemente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};