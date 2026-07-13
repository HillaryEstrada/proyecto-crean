// ============================================
// RUTAS: solicitud.routes.js
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/solicitud/solicitud.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

// ── LECTURA — cualquier usuario autenticado ──
router.get('/todas',              controller.listarTodas);
router.get('/estado/:estado',     controller.listarPorEstado);
router.get('/',                   controller.listar);
router.get('/:id',                controller.obtenerPorId);

// ── ESCRITURA — solo con módulo asignado ──
router.post('/',            verificarModulo('comodato/solicitud'), controller.crear);
router.put('/:id',          verificarModulo('comodato/solicitud'), controller.actualizar);
router.patch('/:id/estado', verificarModulo('comodato/solicitud'), controller.cambiarEstado);
router.delete('/:id',       verificarModulo('comodato/solicitud'), controller.eliminar);

module.exports = router;