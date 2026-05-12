const express = require('express');
const router = express.Router();
const controller = require('../../controllers/alerta/alerta.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

router.get('/',                          verificarModulo('alertas/alertas'), controller.listar);
router.get('/pendientes',                controller.listarPendientes);
router.get('/contador',                  controller.contarPendientes);
router.get('/maquinaria/:id',            controller.listarPorMaquinaria);
router.get('/vehiculo/:id',              controller.listarPorVehiculo);
router.patch('/:id/leida',               controller.marcarLeida);
router.patch('/maquinaria/:id/leidas',   controller.marcarTodasLeidasMaquinaria);
router.patch('/vehiculo/:id/leidas',     controller.marcarTodasLeidasVehiculo);
router.post('/evaluar',                  controller.ejecutarEvaluacion);

module.exports = router;