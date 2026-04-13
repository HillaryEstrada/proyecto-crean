// ============================================
// RUTAS: empleado.routes.js
// Descripción: Endpoints CRUD de empleados
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/auth/empleado.controller');
const { verificarToken, verificarRol } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// GET /empleados - Listar todos (cualquier usuario autenticado)
router.get('/', controller.listar);

// GET /empleados/:id - Obtener uno
router.get('/:id', controller.obtenerPorId);

// POST /empleados - Crear nuevo (solo Administrador)
router.post('/', verificarRol('Administrador'), controller.crear);

// PUT /empleados/:id - Actualizar (solo Administrador)
router.put('/:id', verificarRol('Administrador'), controller.actualizar);

// PATCH /empleados/:id/desactivar - Desactivar (solo Administrador)
router.patch('/:id/desactivar', verificarRol('Administrador'), controller.desactivar);

module.exports = router;