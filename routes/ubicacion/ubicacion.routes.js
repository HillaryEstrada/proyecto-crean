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

// Todas requieren tener el módulo asignado
router.use(verificarModulo('ubicacion/ubicacion'));

// ============================================
// RUTAS DE UBICACIÓN
// ============================================

// GET /ubicacion
router.get('/', controller.listar);

// GET /ubicacion/todas
router.get('/todas', controller.listarTodas);

// GET /ubicacion/:id
router.get('/:id', controller.obtenerPorId);

// POST /ubicacion
router.post('/', controller.crear);

// PUT /ubicacion/:id
router.put('/:id', controller.actualizar);

module.exports = router;