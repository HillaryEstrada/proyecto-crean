const express = require('express');
const router = express.Router();
const controller = require('../../controllers/partida_presupuestal/partida_presupuestal.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

router.get('/',                  controller.listar);
router.get('/todos',             controller.listarTodos);
router.get('/inactivos',         controller.listarInactivos);
router.get('/:id',               controller.obtenerPorId);
router.post('/',                 verificarModulo('partida_presupuestal/partida_presupuestal'), controller.crear);
router.put('/:id',               verificarModulo('partida_presupuestal/partida_presupuestal'), controller.actualizar);
router.patch('/:id/desactivar',  verificarModulo('partida_presupuestal/partida_presupuestal'), controller.desactivar);
router.patch('/:id/reactivar',   verificarModulo('partida_presupuestal/partida_presupuestal'), controller.reactivar);

module.exports = router;