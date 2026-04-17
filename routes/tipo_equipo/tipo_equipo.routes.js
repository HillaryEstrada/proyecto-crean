// ============================================
// RUTAS: tipo_equipo.routes.js
// Descripción: Define los endpoints para el módulo de tipo de equipo
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/tipo_equipo/tipo_equipo.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// ============================================
// RUTAS DE INACTIVOS (ANTES DE /:id para evitar conflictos)
// ============================================

// GET /tipo-equipo/inactivos - Listar tipos de equipo inactivos
router.get('/inactivos', controller.listarInactivos);

// ============================================
// RUTAS SIN PARÁMETRO
// ============================================

// GET /tipo-equipo - Listar todos los activos
router.get('/', controller.listar);

// POST /tipo-equipo - Crear nuevo tipo de equipo
router.post('/', controller.crear);

// ============================================
// RUTAS CON PARÁMETRO :id (AL FINAL)
// ============================================

// GET /tipo-equipo/:id - Obtener por ID
router.get('/:id', controller.obtenerPorId);

// PUT /tipo-equipo/:id - Actualizar tipo de equipo
router.put('/:id', controller.actualizar);

// PATCH /tipo-equipo/:id/desactivar - Desactivar tipo de equipo
router.patch('/:id/desactivar', controller.desactivar);

// PATCH /tipo-equipo/:id/reactivar - Reactivar tipo de equipo
router.patch('/:id/reactivar', controller.reactivar);

module.exports = router;