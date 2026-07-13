const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/entrega/entrega.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

// ── LECTURA — cualquier usuario autenticado ──
router.get('/',       controller.listar);
router.get('/:id',    controller.obtenerPorId);

// ── ESCRITURA — solo con módulo asignado ──
router.post('/',      verificarModulo('comodato/entrega'), controller.crear);
router.delete('/:id', verificarModulo('comodato/entrega'), controller.eliminar);

module.exports = router;