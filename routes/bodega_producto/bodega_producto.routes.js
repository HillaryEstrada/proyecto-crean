// ============================================
// RUTAS: bodega_producto.routes.js
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/bodega_producto/bodega_producto.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

// ── LECTURA — cualquier usuario autenticado ──
router.get('/inactivos', controller.listarInactivos);
router.get('/',          controller.listar);
router.get('/:id',       controller.obtenerPorId);

// ── ESCRITURA — solo con módulo asignado ──
router.post('/', verificarModulo('inventario/bodega_producto'), controller.crear);
router.put('/:id', verificarModulo('inventario/bodega_producto'), controller.actualizar);
router.patch('/:id/desactivar', verificarModulo('inventario/bodega_producto'), controller.desactivar);
router.patch('/:id/reactivar', verificarModulo('inventario/bodega_producto'), controller.reactivar);

module.exports = router;