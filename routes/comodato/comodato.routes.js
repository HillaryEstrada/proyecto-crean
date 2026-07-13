const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/comodato/comodato.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

// ── LECTURA — cualquier usuario autenticado ──
router.get('/todos',          controller.listarTodos);
router.get('/',               controller.listar);
router.get('/:id',            controller.obtenerPorId);

// ── ESCRITURA — solo con módulo asignado ──
router.post('/',              verificarModulo('comodato/comodato'), controller.crear);
router.put('/:id',            verificarModulo('comodato/comodato'), controller.actualizar);
router.patch('/:id/estado',   verificarModulo('comodato/comodato'), controller.cambiarEstado);
router.delete('/:id',         verificarModulo('comodato/comodato'), controller.eliminar);

module.exports = router;