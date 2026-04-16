// ============================================
// RUTAS: expediente.routes.js
// Descripción: Define los endpoints para el módulo de expediente
// ============================================

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/expediente/expediente.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// Todas requieren tener el módulo asignado
router.use(verificarModulo('expediente/expediente'));

// ============================================
// RUTAS DE EXPEDIENTE
// ============================================

// GET /expediente/maquinaria/:id - Expediente completo de maquinaria
router.get('/maquinaria/:id', controller.obtenerExpedienteMaquinaria);

// GET /expediente/vehiculo/:id - Expediente completo de vehículo
router.get('/vehiculo/:id', controller.obtenerExpedienteVehiculo);

module.exports = router;