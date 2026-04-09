
const express = require('express');
const router = express.Router();
const controller = require('../../controllers/categorias/categorias.controller'); // Importa el controlador




// GET /categorias - Listar todos los categorias
router.get('/', controller.listar);

// GET /categorias/:id - Obtener un cliente específico
router.get('/:id', controller.obtenerPorId);

// POST /categorias - Crear un nuevo cliente
router.post('/', controller.crear);

// PUT /categorias/:id - Actualizar un cliente existente
router.put('/:id', controller.actualizar);

// PATCH /categorias/:id/desactivar - Desactivar cliente (soft delete)
router.patch('/:id/desactivar', controller.desactivar);

// DELETE /categorias/:id - Eliminar cliente permanentemente (hard delete)
router.delete('/:id', controller.desaparecer);

module.exports = router; // Exporta el router para usarlo en app.js