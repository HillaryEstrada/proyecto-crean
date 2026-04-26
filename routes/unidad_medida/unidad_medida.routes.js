const express = require('express');
const router = express.Router();
const controller = require('../../controllers/unidad_medida/unidad_medida.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

router.get('/',                  controller.listar);
router.get('/todos',             controller.listarTodos);
router.get('/inactivos',         controller.listarInactivos);
router.get('/:id',               controller.obtenerPorId);
router.post('/',                 verificarModulo('unidad_medida/unidad_medida'), controller.crear);
router.put('/:id',               verificarModulo('unidad_medida/unidad_medida'), controller.actualizar);
router.patch('/:id/desactivar',  verificarModulo('unidad_medida/unidad_medida'), controller.desactivar);
router.patch('/:id/reactivar',   verificarModulo('unidad_medida/unidad_medida'), controller.reactivar);

module.exports = router;