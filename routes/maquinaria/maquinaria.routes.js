// ============================================
// RUTAS: maquinaria.routes.js
// Descripción: Define los endpoints para el módulo de maquinaria
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/maquinaria/maquinaria.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// Todas requieren tener el módulo asignado
router.use(verificarModulo('maquinaria/maquinaria'));

// ============================================
// RUTAS DE BAJAS (ANTES DE /:id para evitar conflictos)
// ============================================

// GET /maquinaria/bajas/registradas - Historial de bajas registradas
router.get('/bajas/registradas', controller.listarBajasRegistradas);

// GET /maquinaria/bajas - Listar maquinaria dada de baja
router.get('/bajas', controller.listarBajas);

// POST /maquinaria/bajas - Registrar una baja en el historial
router.post('/bajas', controller.registrarBaja);

// GET /maquinaria/bajas/:id - Obtener detalle de una baja
router.get('/bajas/:id', controller.obtenerBajaPorId);

// ============================================
// RUTAS DE MAQUINARIA SIN PARÁMETRO
// ============================================

// GET /maquinaria - Listar todas las activas
router.get('/', controller.listar);

// POST /maquinaria - Crear nueva maquinaria
router.post('/', controller.crear);

// ============================================
// RUTAS CON PARÁMETRO :id (AL FINAL)
// ============================================

// GET /maquinaria/:id - Obtener por ID
router.get('/:id', controller.obtenerPorId);

// PUT /maquinaria/:id - Actualizar maquinaria
router.put('/:id', controller.actualizar);

// PATCH /maquinaria/:id/desactivar - Dar de baja lógica
router.patch('/:id/desactivar', controller.desactivar);

module.exports = router;