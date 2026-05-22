// ============================================
// RUTAS: movimiento_mobiliario.routes.js
// Base: /movimientos-mobiliario
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/mobiliario/movimiento_mobiliario.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

router.get('/',                    controller.historialGeneral);
router.get('/mueble/:id',          controller.historialPorMobiliario);
router.post('/registrar', verificarModulo('mobiliario/mobiliario'), controller.registrarMovimiento);
module.exports = router;