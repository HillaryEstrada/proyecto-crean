// ============================================
// RUTAS: maquinaria.routes.js
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/maquinaria/maquinaria.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

router.use(verificarToken);

// ── LECTURA — cualquier usuario autenticado ──
router.get('/bajas/registradas', controller.listarBajasRegistradas);
router.get('/bajas',             controller.listarBajas);
router.get('/bajas/:id',         controller.obtenerBajaPorId);
router.get('/',                  controller.listar);
router.get('/:id',               controller.obtenerPorId);

// ── ESCRITURA — solo con módulo asignado ──
router.post('/',                verificarModulo('maquinaria/maquinaria'), controller.crear);
router.post('/bajas',           verificarModulo('maquinaria/maquinaria'), controller.registrarBaja);
router.put('/:id',              verificarModulo('maquinaria/maquinaria'), controller.actualizar);
router.patch('/:id/desactivar', verificarModulo('maquinaria/maquinaria'), controller.desactivar);

module.exports = router;