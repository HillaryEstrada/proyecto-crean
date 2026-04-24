// ============================================
// RUTAS: productor.routes.js
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/productor/productor.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

// ── LECTURA — cualquier usuario autenticado ──
router.get('/inactivos', controller.listarInactivos);
router.get('/',          controller.listar);
router.get('/:id',       controller.obtenerPorId);

// ── ESCRITURA — solo con módulo asignado ──
router.post('/',                verificarModulo('productor/productor'), controller.crear);
router.put('/:id',              verificarModulo('productor/productor'), controller.actualizar);
router.patch('/:id/desactivar', verificarModulo('productor/productor'), controller.desactivar);
router.patch('/:id/reactivar',  verificarModulo('productor/productor'), controller.reactivar);

module.exports = router;