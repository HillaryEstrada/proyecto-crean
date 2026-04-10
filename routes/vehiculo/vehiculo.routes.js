// ============================================
// RUTAS: vehiculo.routes.js
// Descripción: Define los endpoints para el módulo de vehiculo
// ============================================

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/vehiculo/vehiculo.controller');


// GET /vehiculo - Listar todo el vehiculo
router.get('/', controller.listar);

// GET /vehiculo/:id - Obtener un vehiculo específico
router.get('/:id', controller.obtenerPorId);

// POST /vehiculo - Crear un nuevo vehiculo
router.post('/', controller.crear);

// PUT /vehiculo/:id - Actualizar vehiculo existente
router.put('/:id', controller.actualizar);

// PATCH /vehiculo/:id/desactivar - Baja lógica
router.patch('/:id/desactivar', controller.desactivar);

// DELETE /vehiculo/:id - Eliminación definitiva
router.delete('/:id', controller.desaparecer);

module.exports = router;