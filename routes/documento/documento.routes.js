// ============================================
// RUTAS: documento.routes.js
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/documento/documento.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

// ── LECTURA — cualquier usuario autenticado ──
router.get('/todos',                 controller.listarTodos);
router.get('/tipo/:tipo_documento',  controller.listarPorTipo);
router.get('/comodato/:fk_comodato', controller.listarPorComodato);
router.get('/',                      controller.listar);
router.get('/:id',                   controller.obtenerPorId);

// ── ESCRITURA — solo con módulo asignado ──
router.post('/',            verificarModulo('comodato/documento'), controller.crear);
router.put('/:id',          verificarModulo('comodato/documento'), controller.actualizar);
router.patch('/:id/estado', verificarModulo('comodato/documento'), controller.cambiarEstado);
router.delete('/:id',       verificarModulo('comodato/documento'), controller.eliminar);

module.exports = router;