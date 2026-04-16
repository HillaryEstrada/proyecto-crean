// ============================================
// RUTAS: tipo_equipo.routes.js
// Descripción: Define los endpoints para el módulo de tipo de equipo
// ============================================

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/tipo_equipo/tipo_equipo.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// Todas requieren tener el módulo asignado
router.use(verificarModulo('tipo_equipo/tipo_equipo'));

// ============================================
// RUTAS DE TIPO EQUIPO
// ============================================

// GET /tipo-equipo
router.get('/', controller.listar);

// GET /tipo-equipo/todos
router.get('/todos', controller.listarTodos);

// GET /tipo-equipo/:id
router.get('/:id', controller.obtenerPorId);

// POST /tipo-equipo
router.post('/', controller.crear);

// PUT /tipo-equipo/:id
router.put('/:id', controller.actualizar);

module.exports = router;