// ============================================
// RUTAS: garantia.routes.js
// Descripción: Define los endpoints para el módulo de garantía
// ============================================

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/garantia/garantia.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// Todas requieren tener el módulo asignado
router.use(verificarModulo('garantia/garantia'));

// ============================================
// RUTAS DE GARANTÍA
// ============================================

// GET /garantia
router.get('/', controller.listar);

// GET /garantia/todas
router.get('/todas', controller.listarTodas);

// GET /garantia/:id
router.get('/:id', controller.obtenerPorId);

// POST /garantia
router.post('/', controller.crear);

// PUT /garantia/:id
router.put('/:id', controller.actualizar);

// PATCH /garantia/:id/desactivar
router.patch('/:id/desactivar', controller.desactivar);

// PATCH /garantia/:id/activar
router.patch('/:id/activar', controller.activar);

module.exports = router;