// ============================================
// RUTAS: muestreo_bodega.routes.js
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/muestreo_bodega/muestreo_bodega.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

// ── LECTURA ──
router.get('/',                                      controller.listar);
router.get('/historial/:fk_bodega/:fk_producto',     controller.listarPorBodegaProducto);
router.get('/bodega/:fk_bodega',                     controller.listarPorBodega);
router.get('/:id',                                   controller.obtenerPorId);

// ── ESCRITURA ──
router.post('/',      verificarModulo('inventario/bodega_movimiento'), controller.crear);
router.put('/:id',    verificarModulo('inventario/bodega_movimiento'), controller.actualizar);
router.delete('/:id', verificarModulo('inventario/bodega_movimiento'), controller.eliminar);

module.exports = router;