const express = require('express');
const router = express.Router();
const controller = require('../../controllers/predio/predio.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

router.get('/',                  controller.listar);
router.get('/todos',             controller.listarTodos);
router.get('/inactivos',         controller.listarInactivos);
router.get('/:id',               controller.obtenerPorId);
router.post('/',                 verificarModulo('predio/predio'), controller.crear);
router.put('/:id',               verificarModulo('predio/predio'), controller.actualizar);
router.patch('/:id/desactivar',  verificarModulo('predio/predio'), controller.desactivar);
router.patch('/:id/reactivar',   verificarModulo('predio/predio'), controller.reactivar);

module.exports = router;