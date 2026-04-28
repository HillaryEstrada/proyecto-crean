// ============================================
// RUTAS: movimiento_articulo.routes.js
// Base: /movimientos-articulo
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/consumible/movimiento_articulo.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

router.post('/',            verificarModulo('consumible/consumible'), controller.registrar);
router.get('/articulo/:id', controller.historialPorArticulo);
router.get('/',             controller.historialGeneral);

module.exports = router;