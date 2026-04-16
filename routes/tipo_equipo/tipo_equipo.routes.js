// ============================================
// RUTAS: tipo_equipo.routes.js
// Descripción: Define los endpoints para el módulo de tipo de equipo
// ============================================

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/tipo_equipo/tipo_equipo.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// ── LECTURA — cualquier usuario autenticado ──
router.get('/', controller.listar);
router.get('/todos', controller.listarTodos);
router.get('/:id', controller.obtenerPorId);

// ── ESCRITURA — solo quien tenga el módulo ──
router.post('/', verificarModulo('tipo_equipo/tipo_equipo'), controller.crear);
router.put('/:id', verificarModulo('tipo_equipo/tipo_equipo'), controller.actualizar);

module.exports = router;