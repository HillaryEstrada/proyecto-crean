// ============================================
// RUTAS: vehiculo.routes.js
// Descripción: Define los endpoints para el módulo de vehículos
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/vehiculo/vehiculo.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// ============================================
// LECTURA — cualquier usuario autenticado
// (bajas antes de /:id para evitar conflictos)
// ============================================

// GET /vehiculo/bajas/registradas - Historial de bajas registradas
router.get('/bajas/registradas', controller.listarBajasRegistradas);

// GET /vehiculo/bajas - Listar vehículos dados de baja
router.get('/bajas', controller.listarBajas);

// GET /vehiculo/bajas/:id - Obtener detalle de una baja
router.get('/bajas/:id', controller.obtenerBajaPorId);

// GET /vehiculo - Listar todos los activos
router.get('/', controller.listar);

// GET /vehiculo/:id - Obtener por ID
router.get('/:id', controller.obtenerPorId);

// ============================================
// ESCRITURA — solo con módulo asignado
// ============================================

// POST /vehiculo - Crear nuevo vehículo
router.post('/',      verificarModulo('vehiculo/vehiculo'), controller.crear);

// POST /vehiculo/bajas - Registrar una baja en el historial
router.post('/bajas', verificarModulo('vehiculo/vehiculo'), controller.registrarBaja);

router.put('/bajas/:id', verificarModulo('vehiculo/vehiculo'), controller.actualizarBaja);

// PUT /vehiculo/:id - Actualizar vehículo
router.put('/:id',    verificarModulo('vehiculo/vehiculo'), controller.actualizar);

// PATCH /vehiculo/:id/desactivar - Dar de baja lógica
router.patch('/:id/desactivar', verificarModulo('vehiculo/vehiculo'), controller.desactivar);

module.exports = router;