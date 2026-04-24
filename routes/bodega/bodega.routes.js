// ============================================
// RUTAS: bodega.routes.js
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/bodega/bodega.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

// ── LECTURA — cualquier usuario autenticado ──
router.get('/inhabilitadas', controller.listarInhabilitadas);
router.get('/',              controller.listar);
router.get('/:id',           controller.obtenerPorId);

// ── ESCRITURA — solo con módulo asignado ──
router.post('/',                verificarModulo('inventario/bodega'), controller.crear);
router.put('/:id',              verificarModulo('inventario/bodega'), controller.actualizar);
router.patch('/:id/desactivar', verificarModulo('inventario/bodega'), controller.desactivar);
router.patch('/:id/reactivar',  verificarModulo('inventario/bodega'), controller.reactivar);

module.exports = router;