const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/mantenimiento/mantenimiento.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

router.get('/',       controller.listar);
router.get('/:id',    controller.obtenerPorId);

router.post('/',              verificarModulo('comodato/mantenimiento'), controller.crear);
router.patch('/:id/terminar', verificarModulo('comodato/mantenimiento'), controller.terminar);
router.delete('/:id',         verificarModulo('comodato/mantenimiento'), controller.eliminar);

module.exports = router;