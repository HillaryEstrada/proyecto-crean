// ============================================
// RUTAS: vehiculo.routes.js
// Descripción: Define los endpoints para el módulo de vehiculo
// ============================================

const express = require('express');
const router  = express.Router();
const controller = require('../../controllers/vehiculo/vehiculo.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// Todas requieren tener el módulo asignado
router.use(verificarModulo('vehiculo/vehiculo'));

// GET /vehiculo
router.get('/', controller.listar);

// GET /vehiculo/:id
router.get('/:id', controller.obtenerPorId);

// POST /vehiculo
router.post('/', controller.crear);

// PUT /vehiculo/:id
router.put('/:id', controller.actualizar);

// PATCH /vehiculo/:id/desactivar
router.patch('/:id/desactivar', controller.desactivar);

// DELETE /vehiculo/:id
router.delete('/:id', controller.desaparecer);

module.exports = router;