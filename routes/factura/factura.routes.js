// ============================================
// RUTAS: factura.routes.js
// Descripción: Define los endpoints para el módulo de factura
// ============================================

const express = require('express');
const router  = express.Router();
const controller = require('../../controllers/factura/factura.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// ── LECTURA — cualquier usuario autenticado ──
router.get('/', controller.listar);
router.get('/todas', controller.listarTodas);
router.get('/:id', controller.obtenerPorId);

// ── ESCRITURA — solo con módulo asignado ──
router.post('/', verificarModulo('factura/factura'), controller.crear);
router.put('/:id', verificarModulo('factura/factura'), controller.actualizar);

module.exports = router;