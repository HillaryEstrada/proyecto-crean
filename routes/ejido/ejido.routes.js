const express = require('express');
const router = express.Router();
const controller = require('../../controllers/ejido/ejido.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

router.get('/',             controller.listar);
router.get('/todos',        controller.listarTodos);
router.get('/inactivos',    controller.listarInactivos);
router.get('/:id',          controller.obtenerPorId);
router.post('/',            verificarModulo('ejido/ejido'), controller.crear);
router.put('/:id',          verificarModulo('ejido/ejido'), controller.actualizar);
router.patch('/:id/desactivar', verificarModulo('ejido/ejido'), controller.desactivar);
router.patch('/:id/reactivar',  verificarModulo('ejido/ejido'), controller.reactivar);

module.exports = router;