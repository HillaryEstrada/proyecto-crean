// ============================================
// RUTAS: checklist.routes.js
// Descripción: Define los endpoints para el módulo de checklist
// ============================================

const express = require('express');
const router  = express.Router();
const controller = require('../../controllers/checklist/checklist.controller');
const { verificarToken, verificarModulo } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// Todas requieren tener el módulo asignado
router.use(verificarModulo('checklist/checklist'));


// GET /checklist
router.get('/', controller.listar);


// GET /checklist/:id
router.get('/:id', controller.obtenerPorId);


// GET /checklist/maquinaria/:id
router.get('/maquinaria/:id', controller.obtenerPorMaquinaria);


// POST /checklist
router.post('/', controller.crear);


// PUT /checklist/:id
router.put('/:id', controller.actualizar);


// DELETE /checklist/:id
router.delete('/:id', controller.eliminar);


module.exports = router;