// ============================================
// RUTAS: empleado.routes.js
// Descripción: Endpoints CRUD de empleados
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/auth/empleado.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// GET /empleados - Listar todos (cualquier usuario autenticado)
router.get('/', controller.listar);

router.get('/bajas', controller.listarBajas);

// GET /empleados/:id - Obtener uno
router.get('/:id', controller.obtenerPorId);

// POST /empleados - Crear nuevo (quien tenga el módulo)
router.post('/', verificarModulo('admin/empleados'), controller.crear);

// PUT /empleados/:id - Actualizar (quien tenga el módulo)
router.put('/:id', verificarModulo('admin/empleados'), controller.actualizar);

// PATCH /empleados/:id/desactivar - Desactivar (quien tenga el módulo)
router.patch('/:id/desactivar', verificarModulo('admin/empleados'), controller.desactivar);

router.patch('/:id/foto', verificarModulo('admin/empleados'), controller.actualizarFoto);

module.exports = router;