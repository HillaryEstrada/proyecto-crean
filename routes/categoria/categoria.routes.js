const express = require('express');
const router = express.Router();
const controller = require('../../controllers/categoria/categoria.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

router.get('/',                  controller.listar);
router.get('/todos',             controller.listarTodos);
router.get('/inactivos',         controller.listarInactivos);
router.get('/:id',               controller.obtenerPorId);
router.post('/',                 verificarModulo('categoria/categoria'), controller.crear);
router.put('/:id',               verificarModulo('categoria/categoria'), controller.actualizar);
router.patch('/:id/desactivar',  verificarModulo('categoria/categoria'), controller.desactivar);
router.patch('/:id/reactivar',   verificarModulo('categoria/categoria'), controller.reactivar);

module.exports = router;