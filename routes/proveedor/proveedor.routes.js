// ============================================
// RUTAS: proveedor.routes.js
// Descripción: Define los endpoints para el módulo de proveedor
// ============================================

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/proveedor/proveedor.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// Todas requieren tener el módulo asignado
router.use(verificarModulo('proveedor/proveedor'));

// ============================================
// RUTAS DE PROVEEDOR
// ============================================

// GET /proveedor
router.get('/', controller.listar);

// GET /proveedor/todos
router.get('/todos', controller.listarTodos);

// GET /proveedor/:id
router.get('/:id', controller.obtenerPorId);

// POST /proveedor
router.post('/', controller.crear);

// PUT /proveedor/:id
router.put('/:id', controller.actualizar);

module.exports = router;