// ============================================
// RUTAS: factura.routes.js
// Descripción: Define los endpoints para el módulo de factura
// ============================================

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/factura/factura.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// Todas requieren tener el módulo asignado
router.use(verificarModulo('factura/factura'));

// ============================================
// RUTAS DE FACTURA
// ============================================

// GET /factura
router.get('/', controller.listar);

// GET /factura/todas
router.get('/todas', controller.listarTodas);

// GET /factura/:id
router.get('/:id', controller.obtenerPorId);

// POST /factura
router.post('/', controller.crear);

// PUT /factura/:id
router.put('/:id', controller.actualizar);

module.exports = router;