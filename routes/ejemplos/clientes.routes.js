// ============================================
// RUTAS: clientes.routes.js
// Descripción: Define los endpoints para el módulo de clientes
// ============================================

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/ejemplos/clientes.controller'); // Importa el controlador




// GET /clientes - Listar todos los clientes
router.get('/', controller.listar);

// GET /clientes/:id - Obtener un cliente específico
router.get('/:id', controller.obtenerPorId);

// POST /clientes - Crear un nuevo cliente
router.post('/', controller.crear);

// PUT /clientes/:id - Actualizar un cliente existente
router.put('/:id', controller.actualizar);

// PATCH /clientes/:id/desactivar - Desactivar cliente (soft delete)
router.patch('/:id/desactivar', controller.desactivar);

// DELETE /clientes/:id - Eliminar cliente permanentemente (hard delete)
router.delete('/:id', controller.desaparecer);

module.exports = router; // Exporta el router para usarlo en app.js