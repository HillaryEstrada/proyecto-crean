// ============================================
// RUTAS: vehiculo.routes.js
// Descripción: Define los endpoints para el módulo de vehículo
// ============================================

const express = require('express');
const router  = express.Router();
const controller = require('../../controllers/vehiculo/vehiculo.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');
const {
    validarCamposRequeridosCrear,
    validarFKVehiculo,
    validarCamposUnicosVehiculo,
    validarNoBaja,
    validarNoEnBaja,
    validarRegistroBaja
} = require('../../middleware/vehiculo.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// Todas requieren tener el módulo asignado
router.use(verificarModulo('vehiculo/vehiculo'));

// ============================================
// RUTAS DE VEHÍCULO (SIN PARÁMETRO)
// ============================================

// GET /vehiculo - Listar todos activos
router.get('/', controller.listar);

// POST /vehiculo - Crear nuevo
router.post('/',
    validarCamposRequeridosCrear,
    validarFKVehiculo,
    validarCamposUnicosVehiculo,
    controller.crear
);

// ============================================
// RUTAS DE BAJAS (ANTES DE /:id)
// ============================================

// GET /vehiculo/bajas/registradas - Listar historial de bajas
router.get('/bajas/registradas', controller.listarBajasRegistradas);

// GET /vehiculo/bajas - Listar vehículos dados de baja
router.get('/bajas', controller.listarBajas);

// POST /vehiculo/bajas - Registrar una baja
router.post('/bajas',
    validarRegistroBaja,
    controller.registrarBaja
);

// GET /vehiculo/bajas/:id - Obtener detalle de una baja
router.get('/bajas/:id', controller.obtenerBajaPorId);

// ============================================
// RUTAS CON PARÁMETRO :id (AL FINAL)
// ============================================

// GET /vehiculo/:id - Obtener por ID
router.get('/:id', controller.obtenerPorId);

// PUT /vehiculo/:id - Actualizar
router.put('/:id',
    validarNoBaja,
    validarCamposUnicosVehiculo,
    validarFKVehiculo,
    controller.actualizar
);

// PATCH /vehiculo/:id/desactivar - Dar de baja
router.patch('/:id/desactivar',
    validarNoEnBaja,
    controller.desactivar
);

module.exports = router;