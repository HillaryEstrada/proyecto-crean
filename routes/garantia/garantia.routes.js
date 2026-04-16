// ============================================
// RUTAS: garantia.routes.js
// Descripción: Define los endpoints para el módulo de garantía
// ============================================

const express = require('express');
const router  = express.Router();
const controller = require('../../controllers/garantia/garantia.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// ── LECTURA — cualquier usuario autenticado ──
router.get('/', controller.listar);
router.get('/todas', controller.listarTodas);
router.get('/:id', controller.obtenerPorId);

// ── ESCRITURA — solo con módulo asignado ──
router.post('/', verificarModulo('garantia/garantia'), controller.crear);
router.put('/:id', verificarModulo('garantia/garantia'), controller.actualizar);
router.patch('/:id/desactivar', verificarModulo('garantia/garantia'), controller.desactivar);
router.patch('/:id/activar', verificarModulo('garantia/garantia'), controller.activar);

module.exports = router;