const express = require('express');
const router = express.Router();
const controller = require('../../controllers/almacen/almacen.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

router.get('/',                  controller.listar);
router.get('/todos',             controller.listarTodos);
router.get('/inactivos',         controller.listarInactivos);
router.get('/:id',               controller.obtenerPorId);
router.post('/',                 verificarModulo('almacen/almacen'), controller.crear);
router.put('/:id',               verificarModulo('almacen/almacen'), controller.actualizar);
router.patch('/:id/desactivar',  verificarModulo('almacen/almacen'), controller.desactivar);
router.patch('/:id/reactivar',   verificarModulo('almacen/almacen'), controller.reactivar);

module.exports = router;