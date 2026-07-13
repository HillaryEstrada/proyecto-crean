const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/devolucion/devolucion.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

router.get('/',       controller.listar);
router.get('/:id',    controller.obtenerPorId);

router.post('/',      verificarModulo('comodato/devolucion'), controller.crear);
router.delete('/:id', verificarModulo('comodato/devolucion'), controller.eliminar);

module.exports = router;