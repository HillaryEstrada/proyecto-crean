// ============================================
// RUTAS: roles.routes.js
// Descripción: Endpoints de roles
// ============================================

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/auth/roles.controller');
const { verificarToken } = require('../../middleware/auth.middleware');

// Requiere autenticación
router.use(verificarToken);

// GET /roles - Listar todos los roles
router.get('/', controller.listar);

// GET /roles/:id - Obtener un rol específico
router.get('/:id', controller.obtenerPorId);

module.exports = router;