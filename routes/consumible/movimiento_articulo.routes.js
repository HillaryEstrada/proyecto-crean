// ============================================
// RUTAS: movimiento_articulo.routes.js
// Base: /movimientos-articulo
// ============================================

const express = require('express');
const router  = express.Router();
const controller = require('../../controllers/consumible/movimiento_articulo.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

// Registrar movimiento
router.post('/',              verificarModulo('consumible/consumible'), controller.registrar);

// Historial general (con filtros opcionales ?tipo=&fecha_inicio=&fecha_fin=)
router.get('/',               controller.historialGeneral);

// Historial por artículo
router.get('/:id',            controller.historialPorArticulo);

module.exports = router;