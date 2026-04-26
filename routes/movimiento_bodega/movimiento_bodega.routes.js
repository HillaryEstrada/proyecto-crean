// ============================================
// RUTAS: movimiento_bodega.routes.js
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/movimiento_bodega/movimiento_bodega.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

// ── LECTURA — cualquier usuario autenticado ──
router.get('/',    controller.listar);
router.get('/:id', controller.obtenerDetalle);

// ── ESCRITURA — solo con módulo asignado ──
router.post('/',    verificarModulo('inventario/bodega_movimiento'), controller.crearMovimiento);
router.put('/:id',  verificarModulo('inventario/bodega_movimiento'), controller.actualizarMovimiento);

module.exports = router;