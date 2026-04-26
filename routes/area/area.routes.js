const express = require('express');
const router = express.Router();
const controller = require('../../controllers/area/area.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

router.get('/',                  controller.listar);
router.get('/todos',             controller.listarTodos);
router.get('/inactivos',         controller.listarInactivos);
router.get('/:id',               controller.obtenerPorId);
router.post('/',                 verificarModulo('area/area'), controller.crear);
router.put('/:id',               verificarModulo('area/area'), controller.actualizar);
router.patch('/:id/desactivar',  verificarModulo('area/area'), controller.desactivar);
router.patch('/:id/reactivar',   verificarModulo('area/area'), controller.reactivar);

module.exports = router;