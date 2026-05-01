// ============================================
// RUTAS: tipo_contrato.routes.js
// Descripción: Endpoints CRUD de tipos de contrato
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/auth/tipo_contrato.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// GET /tipo_contrato - Listar todos
router.get('/', controller.listar);

// GET /tipo_contrato/:id - Obtener uno
router.get('/:id', controller.obtenerPorId);

// POST /tipo_contrato - Crear nuevo
router.post('/',    verificarModulo('admin/tipo_contrato'), controller.crear);

// PUT /tipo_contrato/:id - Actualizar
router.put('/:id', verificarModulo('admin/tipo_contrato'), controller.actualizar);

// DELETE /tipo_contrato/:id - Eliminar (con validación)
router.delete('/:id', verificarModulo('admin/tipo_contrato'), controller.eliminar);

module.exports = router;