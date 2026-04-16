// ============================================
// RUTAS: alerta.routes.js
// Descripción: Define los endpoints para el módulo de alertas
// ============================================

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/alerta/alerta.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// Todas requieren tener el módulo asignado
router.use(verificarModulo('alertas/alertas'));

// ============================================
// RUTAS DE ALERTAS
// ============================================

// GET /alertas - Listar todas las alertas
router.get('/', controller.listar);

// GET /alertas/pendientes - Listar alertas no leídas
router.get('/pendientes', controller.listarPendientes);

// GET /alertas/contador - Badge con totales por categoría
router.get('/contador', controller.contarPendientes);

// GET /alertas/maquinaria/:id - Alertas de una maquinaria
router.get('/maquinaria/:id', controller.listarPorMaquinaria);

// GET /alertas/vehiculo/:id - Alertas de un vehículo
router.get('/vehiculo/:id', controller.listarPorVehiculo);

// PATCH /alertas/:id/leida - Marcar una alerta como leída
router.patch('/:id/leida', controller.marcarLeida);

// PATCH /alertas/maquinaria/:id/leidas - Marcar todas de una maquinaria como leídas
router.patch('/maquinaria/:id/leidas', controller.marcarTodasLeidasMaquinaria);

// PATCH /alertas/vehiculo/:id/leidas - Marcar todas de un vehículo como leídas
router.patch('/vehiculo/:id/leidas', controller.marcarTodasLeidasVehiculo);

// POST /alertas/evaluar - Ejecutar evaluación manual (solo en desarrollo/admin)
router.post('/evaluar', controller.ejecutarEvaluacion);

module.exports = router;