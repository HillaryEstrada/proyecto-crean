// ============================================
// RUTAS: mobiliario.routes.js
// Base: /mobiliario
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/mobiliario/mobiliario.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

// ── Consultas ──────────────────────────────
router.get('/',            controller.listar);
router.get('/bajas',       controller.listarBajas);
router.get('/disponibles', controller.listarDisponibles);
router.get('/:id',         controller.obtenerPorId);

// ── Escritura ──────────────────────────────
router.post('/',                          verificarModulo('mobiliario/mobiliario'), controller.crear);
router.put('/:id',                        verificarModulo('mobiliario/mobiliario'), controller.actualizar);
router.patch('/:id/baja',                 verificarModulo('mobiliario/mobiliario'), controller.darBaja);
router.patch('/:id/mantenimiento',        verificarModulo('mobiliario/mobiliario'), controller.enviarMantenimiento);
router.patch('/:id/disponible',           verificarModulo('mobiliario/mobiliario'), controller.regresarDisponible);

module.exports = router;