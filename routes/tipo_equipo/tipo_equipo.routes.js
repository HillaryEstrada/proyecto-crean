// ============================================
// RUTAS: tipo_equipo.routes.js
// Descripción: Define los endpoints para el módulo de tipo de equipo
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/tipo_equipo/tipo_equipo.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// ── LECTURA — cualquier usuario autenticado ──
router.get('/',          controller.listar);
router.get('/inactivos', controller.listarInactivos);
router.get('/:id',       controller.obtenerPorId);

// ── ESCRITURA — solo con módulo asignado ──
router.post('/',                verificarModulo('tipo_equipo/tipo_equipo'), controller.crear);
router.put('/:id',              verificarModulo('tipo_equipo/tipo_equipo'), controller.actualizar);
router.patch('/:id/desactivar', verificarModulo('tipo_equipo/tipo_equipo'), controller.desactivar);
router.patch('/:id/reactivar',  verificarModulo('tipo_equipo/tipo_equipo'), controller.reactivar);

module.exports = router;