// ============================================
// RUTAS: maquinaria.routes.js
// Descripción: Define los endpoints para el módulo de maquinaria
// ============================================

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/maquinaria/maquinaria.controller');


// GET /maquinaria - Listar toda la maquinaria
router.get('/', controller.listar);

// GET /maquinaria/:id - Obtener una maquinaria específica
router.get('/:id', controller.obtenerPorId);

// POST /maquinaria - Crear una nueva maquinaria
router.post('/', controller.crear);

// PUT /maquinaria/:id - Actualizar maquinaria existente
router.put('/:id', controller.actualizar);

// PATCH /maquinaria/:id/desactivar - Baja lógica
router.patch('/:id/desactivar', controller.desactivar);

// DELETE /maquinaria/:id - Eliminación definitiva
router.delete('/:id', controller.desaparecer);

module.exports = router;