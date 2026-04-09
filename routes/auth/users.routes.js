// ============================================
// RUTAS: users.routes.js
// Descripción: Endpoints de gestión de usuarios
// ============================================

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/auth/users.controller');
const { verificarToken, verificarRol } = require('../../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Todas las rutas requieren rol de Administrador
router.use(verificarRol('Administrador'));

// GET /users - Listar todos los usuarios
router.get('/', controller.listar);

// GET /users/:id - Obtener un usuario específico
router.get('/:id', controller.obtenerPorId);

// POST /users - Crear nuevo usuario
router.post('/', controller.crear);

// PUT /users/:id - Actualizar usuario existente
router.put('/:id', controller.actualizar);

// PATCH /users/:id/desactivar - Desactivar usuario (soft delete)
router.patch('/:id/desactivar', controller.desactivar);

// DELETE /users/:id - Eliminar usuario permanentemente (hard delete)
router.delete('/:id', controller.desaparecer);

module.exports = router;