const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/falla/falla.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

router.get('/',       controller.listar);
router.get('/:id',    controller.obtenerPorId);

router.post('/',              verificarModulo('comodato/falla'), controller.crear);
router.patch('/:id/estado',   verificarModulo('comodato/falla'), controller.cambiarEstado);
router.delete('/:id',         verificarModulo('comodato/falla'), controller.eliminar);

module.exports = router;