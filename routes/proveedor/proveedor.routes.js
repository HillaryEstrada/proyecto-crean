const express = require('express');
const router = express.Router();
const controller = require('../../controllers/proveedor/proveedor.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);
router.use(verificarModulo('proveedor/proveedor'));

router.get('/', controller.listar);
router.get('/todos', controller.listarTodos);
router.get('/:id', controller.obtenerPorId);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.patch('/:id/desactivar', controller.desactivar);
router.patch('/:id/reactivar', controller.reactivar);

module.exports = router;