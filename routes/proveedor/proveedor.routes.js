const express = require('express');
const router = express.Router();
const controller = require('../../controllers/proveedor/proveedor.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);
// ← router.use(verificarModulo('proveedor/proveedor'));  QUITADA

router.get('/', controller.listar);
router.get('/todos', controller.listarTodos);
router.get('/:id', controller.obtenerPorId);
router.post('/', verificarModulo('proveedor/proveedor'), controller.crear);
router.put('/:id', verificarModulo('proveedor/proveedor'), controller.actualizar);
router.patch('/:id/desactivar', verificarModulo('proveedor/proveedor'), controller.desactivar);
router.patch('/:id/reactivar', verificarModulo('proveedor/proveedor'), controller.reactivar);

module.exports = router;