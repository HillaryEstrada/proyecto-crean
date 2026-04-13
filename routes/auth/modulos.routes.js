// ============================================
// RUTAS: modulos.routes.js
// Descripción: Endpoints de gestión de módulos
// ============================================

const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/auth/modulos.controller');
const { verificarToken, verificarRol } = require('../../middleware/auth.middleware');

// Todas requieren autenticación
router.use(verificarToken);

// GET /modulos - Listar todos los módulos
router.get('/', verificarRol('Administrador'), controller.listar);

// GET /modulos/roles - Listar roles para el selector UI
router.get('/roles', verificarRol('Administrador'), controller.listarRoles);

// GET /modulos/rol/:id - Módulos de un rol con estado asignado
router.get('/rol/:id', verificarRol('Administrador'), controller.obtenerPorRol);

// POST /modulos/rol/:id - Guardar asignación de módulos a un rol
router.post('/rol/:id', verificarRol('Administrador'), controller.asignarArol);

// GET /modulos/user/:id?fk_rol=X - Módulos de un usuario (base + excepciones)
router.get('/user/:id', verificarRol('Administrador'), controller.obtenerPorUser);

// POST /modulos/user/:id - Guardar excepciones individuales del usuario
router.post('/user/:id', verificarRol('Administrador'), controller.guardarExcepcionesUser);

module.exports = router;