// ============================================
// RUTAS: inventario_bodega.routes.js
// Solo lectura — sin POST, PUT, DELETE
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/inventario_bodega/inventario_bodega.controller');
const { verificarToken } = require('../../middleware/auth.middleware');

router.use(verificarToken);

// ── Solo lectura ──
router.get('/', controller.obtenerInventario);

module.exports = router;