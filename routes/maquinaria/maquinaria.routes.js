// ============================================
// RUTAS: maquinaria.routes.js
// ============================================

const express = require('express');
const router  = express.Router();

const {
    getTipos,
    crearTipo,
    getUbicaciones,
    getCategoriasUbicacion,
    getProveedores,
    crearProveedor,
    getMaquinaria,
    getMaquinariaById,
    getMaquinariasBajas,
    crearMaquinaria,
    actualizarMaquinaria,
    desactivarMaquinaria,
    eliminarMaquinaria
} = require('../../controllers/maquinaria/maquinaria.controller');

// ── Catálogos ────────────────────────────────
router.get( '/tipos',        getTipos);
router.post('/tipos',        crearTipo);
router.get( '/ubicaciones',  getUbicaciones);
router.get( '/proveedores',  getProveedores);
router.post('/proveedores',  crearProveedor);

// ── CRUD Maquinaria ──────────────────────────
router.get(   '/',               getMaquinaria);
router.get(   '/bajas',          getMaquinariasBajas);  
router.get(   '/ubicaciones/categorias', getCategoriasUbicacion);
router.get(   '/:id',            getMaquinariaById);
router.post(  '/',               crearMaquinaria);
router.put(   '/:id',            actualizarMaquinaria);
router.patch( '/:id/desactivar', desactivarMaquinaria);
router.delete('/:id',            eliminarMaquinaria);

module.exports = router;