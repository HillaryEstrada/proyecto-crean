// ============================================
// RUTAS: maquinaria.routes.js
// Descripción: Define los endpoints para el módulo de maquinaria
// ============================================

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/maquinaria/maquinaria.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');
const {
    validarCamposRequeridos,
    validarFKMaquinaria,
    validarCamposUnicosMaquinaria,
    validarNoBaja,
    validarNoEnBaja,
    validarRegistroBaja
} = require('../../middleware/maquinaria.middleware');


// Todas requieren autenticación
router.use(verificarToken);

// Todas requieren tener el módulo asignado
router.use(verificarModulo('maquinaria/maquinaria'));

// ============================================
// RUTAS DE MAQUINARIA (SIN PARÁMETRO)
// ============================================

// GET /maquinaria - Listar todas activas
router.get('/', controller.listar);

// POST /maquinaria - Crear nueva
router.post('/',
    validarCamposRequeridos,
    validarFKMaquinaria,
    validarCamposUnicosMaquinaria,
    controller.crear
);

// ============================================
// RUTAS DE BAJAS (ANTES DE /:id)
// ============================================

// GET /maquinaria/bajas/registradas - Listar historial de bajas
router.get('/bajas/registradas', controller.listarBajasRegistradas);

// GET /maquinaria/bajas - Listar maquinaria dada de baja
router.get('/bajas', controller.listarBajas);

// POST /maquinaria/bajas - Registrar una baja
router.post('/bajas',
    validarRegistroBaja,
    controller.registrarBaja
);

// GET /maquinaria/bajas/:id - Obtener detalle de una baja
router.get('/bajas/:id', controller.obtenerBajaPorId);

// ============================================
// RUTAS CON PARÁMETRO :id (AL FINAL)
// ============================================

// GET /maquinaria/:id - Obtener por ID
router.get('/:id', controller.obtenerPorId);

// PUT /maquinaria/:id - Actualizar
router.put('/:id',
    validarNoBaja,
    validarCamposUnicosMaquinaria,
    validarFKMaquinaria,
    controller.actualizar
);

// PATCH /maquinaria/:id/desactivar - Dar de baja
router.patch('/:id/desactivar',
    validarNoEnBaja,
    controller.desactivar
);

module.exports = router;