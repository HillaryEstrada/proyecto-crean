// ============================================
// RUTAS: prestamo_mobiliario.routes.js
// Base: /prestamo-mobiliario
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/mobiliario/prestamo_mobiliario.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

// ── Consultas ──────────────────────────────
router.get('/',              controller.listarTodos);
router.get('/activos',       controller.listarActivos);
router.get('/:id/detalle',   controller.obtenerDetalle);

// ── Escritura ──────────────────────────────
router.post('/',                  verificarModulo('mobiliario/mobiliario'), controller.crear);
router.patch('/:id/finalizar',    verificarModulo('mobiliario/mobiliario'), controller.finalizar);
router.patch('/:id/cancelar',     verificarModulo('mobiliario/mobiliario'), controller.cancelar);

module.exports = router;