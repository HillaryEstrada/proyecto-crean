// ============================================
// RUTAS: maquinaria.routes.js
// Descripción: Define los endpoints para el módulo de maquinaria
// ============================================

const express = require('express');
const router  = express.Router();
const controller = require('../../controllers/maquinaria/maquinaria.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// Todas requieren tener el módulo asignado
router.use(verificarModulo('maquinaria/maquinaria'));

// GET /maquinaria/bajas
router.get('/bajas', controller.listarBajas);

// GET /maquinaria
router.get('/', controller.listar);

// GET /maquinaria/:id
router.get('/:id', controller.obtenerPorId);

// POST /maquinaria
router.post('/', controller.crear);

// PUT /maquinaria/:id
router.put('/:id', controller.actualizar);

// PATCH /maquinaria/:id/desactivar
router.patch('/:id/desactivar', controller.desactivar);

// DELETE /maquinaria/:id
router.delete('/:id', controller.desaparecer);

module.exports = router;