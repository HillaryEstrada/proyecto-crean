// ============================================
// RUTAS: motivo_baja.routes.js
// Descripción: Endpoints CRUD de motivos de baja
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/auth/motivo_baja.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// GET /motivo-baja - Listar todos
router.get('/', controller.listar);

// GET /motivo-baja/:id - Obtener uno
router.get('/:id', controller.obtenerPorId);

// POST /motivo-baja - Crear nuevo
router.post('/',    verificarModulo('admin/motivo_baja'), controller.crear);

// PUT /motivo-baja/:id - Actualizar
router.put('/:id', verificarModulo('admin/motivo_baja'), controller.actualizar);

// DELETE /motivo-baja/:id - Eliminar (con validación)
router.delete('/:id', verificarModulo('admin/motivo_baja'), controller.eliminar);

module.exports = router;