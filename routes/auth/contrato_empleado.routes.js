// ============================================
// RUTAS: contrato_empleado.routes.js
// Descripción: Endpoints de consulta de contratos (solo lectura externa)
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/auth/contrato_empleado.controller');
const { verificarToken } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// GET /empleados/:id/contratos - Historial de contratos
router.get('/:id/contratos', controller.listarPorEmpleado);

// GET /empleados/:id/contrato-activo - Contrato activo actual
router.get('/:id/contrato-activo', controller.obtenerActivo);

module.exports = router;