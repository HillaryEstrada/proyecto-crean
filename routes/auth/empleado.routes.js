// ============================================
// RUTAS: empleado.routes.js
// Descripción: Endpoints CRUD de empleados
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/auth/empleado.controller');
const contratoController = require('../../controllers/auth/contrato_empleado.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// GET /empleados - Listar todos (cualquier usuario autenticado)
router.get('/', controller.listar);

router.get('/bajas', controller.listarBajas);

// GET /empleados/:id - Obtener uno
router.get('/:id', controller.obtenerPorId);

// ─── Contratos (historial / consulta) ────────────────────────────────────────
// GET /empleados/:id/contratos - Historial de contratos
router.get('/:id/contratos', contratoController.listarPorEmpleado);

// GET /empleados/:id/contrato-activo - Contrato activo actual
router.get('/:id/contrato-activo', contratoController.obtenerActivo);

// POST /empleados - Crear nuevo (quien tenga el módulo)
router.post('/', verificarModulo('admin/empleados'), controller.crear);

// PUT /empleados/:id - Actualizar (quien tenga el módulo)
router.put('/:id', verificarModulo('admin/empleados'), controller.actualizar);

// PATCH /empleados/:id/desactivar - Desactivar (quien tenga el módulo)
router.patch('/:id/desactivar', verificarModulo('admin/empleados'), controller.desactivar);

router.patch('/:id/foto', verificarModulo('admin/empleados'), controller.actualizarFoto);

// ─── NUEVO: Control laboral ───────────────────────────────────────────────────
// PATCH /empleados/:id/baja - Dar de baja con motivo
router.patch('/:id/baja', verificarModulo('admin/empleados'), controller.darDeBaja);

// PUT /empleados/:id/reactivar - Reactivar empleado
router.put('/:id/reactivar', verificarModulo('admin/empleados'), controller.reactivar);

router.patch('/:id/renovar-contrato', verificarModulo('admin/empleados'), controller.renovarContrato);

module.exports = router;