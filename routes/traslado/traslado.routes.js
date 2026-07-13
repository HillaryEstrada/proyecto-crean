// ============================================
// RUTAS: traslado.routes.js
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/traslado/traslado.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

// ── LECTURA — cualquier usuario autenticado ──
router.get('/todos',                 controller.listarTodos);
router.get('/comodato/:fk_comodato', controller.listarPorComodato);
router.get('/',                      controller.listar);
router.get('/:id',                   controller.obtenerPorId);

// ── ESCRITURA — solo con módulo asignado ──
router.post('/',             verificarModulo('comodato/traslado'), controller.crear);
router.put('/:id',           verificarModulo('comodato/traslado'), controller.actualizar);
router.patch('/:id/llegada', verificarModulo('comodato/traslado'), controller.registrarLlegada);
router.delete('/:id',        verificarModulo('comodato/traslado'), controller.eliminar);

module.exports = router;