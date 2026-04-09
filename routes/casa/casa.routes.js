// ============================================
// RUTAS: casa.routes.js
// Descripción: Define los endpoints para el módulo de casa
// ============================================

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/casa/casa.controller'); // Importa el controlador




// GET /casa - Listar todos los casa
router.get('/', controller.listar);

// GET /casa/:id - Obtener un cliente específico
router.get('/:id', controller.obtenerPorId);

// POST /casa - Crear un nuevo cliente
router.post('/', controller.crear);

// PUT /casa/:id - Actualizar un cliente existente
router.put('/:id', controller.actualizar);

// PATCH /casa/:id/desactivar - Desactivar cliente (soft delete)
router.patch('/:id/desactivar', controller.desactivar);

// DELETE /casa/:id - Eliminar cliente permanentemente (hard delete)
router.delete('/:id', controller.desaparecer);

module.exports = router; // Exporta el router para usarlo en app.js