// ============================================
// RUTAS: auth.routes.js
// Descripción: Endpoints de autenticación
// ============================================

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/auth/auth.controller');
const { verificarToken } = require('../../middleware/auth.middleware');

// POST /auth/login - Iniciar sesión (público)
router.post('/login', controller.login);

// POST /auth/logout - Cerrar sesión (requiere autenticación)
router.post('/logout', verificarToken, controller.logout);

// GET /auth/verificar - Verificar sesión actual (requiere autenticación)
router.get('/verificar', verificarToken, controller.verificarSesion);

module.exports = router;