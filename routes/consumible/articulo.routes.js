// ============================================
// RUTAS: articulo.routes.js
// Base: /articulos
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/consumible/articulo.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

// ── Consultas ──────────────────────────────
router.get('/',           controller.listar);
router.get('/stock-bajo', controller.stockBajo);
router.get('/categorias', controller.listarCategorias);
router.get('/inactivos',  controller.listarInactivos);
router.get('/:id',        controller.obtenerPorId);

// ── Escritura ──────────────────────────────
router.post('/',                verificarModulo('consumible/consumible'), controller.crear);
router.put('/:id',              verificarModulo('consumible/consumible'), controller.actualizar);

module.exports = router;