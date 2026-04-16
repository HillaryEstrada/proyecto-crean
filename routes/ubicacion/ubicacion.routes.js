// ============================================
// RUTAS: ubicacion.routes.js
// Descripción: Define los endpoints para el módulo de ubicación
// ============================================

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/ubicacion/ubicacion.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// ── LECTURA — cualquier usuario autenticado ──
router.get('/', controller.listar);
router.get('/todas', controller.listarTodas);
router.get('/:id', controller.obtenerPorId);

// ── ESCRITURA — solo quien tenga el módulo ──
router.post('/', verificarModulo('ubicacion/ubicacion'), controller.crear);
router.put('/:id', verificarModulo('ubicacion/ubicacion'), controller.actualizar);

module.exports = router;