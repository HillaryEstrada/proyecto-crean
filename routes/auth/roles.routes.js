// ============================================
// RUTAS: roles.routes.js
// Descripción: Endpoints de roles
// ============================================

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/auth/roles.controller');
const { verificarToken, verificarRol } = require('../../middleware/auth.middleware');

// Requiere autenticación
router.use(verificarToken);

// GET /roles - Listar todos los roles activos
router.get('/', controller.listar);

// GET /roles/todos - Listar todos (activos e inactivos)
router.get('/todos', verificarRol('Administrador'), controller.listarTodos);

// GET /roles/:id - Obtener un rol específico
router.get('/:id', controller.obtenerPorId);

// POST /roles - Crear nuevo rol
router.post('/', verificarRol('Administrador'), controller.crear);

// PUT /roles/:id - Actualizar rol
router.put('/:id', verificarRol('Administrador'), controller.actualizar);

// PATCH /roles/:id/desactivar - Desactivar rol
router.patch('/:id/desactivar', verificarRol('Administrador'), controller.desactivar);

// PATCH /roles/:id/activar - Activar rol
router.patch('/:id/activar', verificarRol('Administrador'), controller.activar);

module.exports = router;