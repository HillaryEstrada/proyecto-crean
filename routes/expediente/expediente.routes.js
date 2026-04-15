// ============================================
// RUTAS: expediente.routes.js
// Descripción: Endpoint de sólo lectura para el expediente de maquinaria
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/maquinaria/expediente.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Requiere acceso al módulo de maquinaria
router.use(verificarModulo('maquinaria/maquinaria'));

// GET /maquinaria/:id/expediente
router.get('/:id/expediente', controller.obtenerExpediente);

module.exports = router;