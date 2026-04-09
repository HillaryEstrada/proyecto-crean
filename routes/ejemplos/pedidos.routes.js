// ============================================
// RUTAS: pedidos.routes.js
// Descripción: Define los endpoints para el módulo de pedidos
// ============================================

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/ejemplos/pedidos.controller'); // Importa el controlador

// GET /pedidos - Listar todos los pedidos con información del cliente
router.get('/', controller.listar);

// GET /pedidos/:id - Obtener un pedido específico
router.get('/:id', controller.obtenerPorId);

// POST /pedidos - Crear un nuevo pedido
router.post('/', controller.crear);

// PUT /pedidos/:id - Actualizar un pedido existente
router.put('/:id', controller.actualizar);

// PATCH /pedidos/:id/desactivar - Desactivar pedido (soft delete)
router.patch('/:id/desactivar', controller.desactivar);

// DELETE /pedidos/:id - Eliminar pedido permanentemente (hard delete)
router.delete('/:id', controller.desaparecer);

module.exports = router; // Exporta el router para usarlo en app.js