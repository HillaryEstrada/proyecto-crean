// ============================================
// CONTROLADOR: inventario_bodega.controller.js
// Descripción: Solo lectura — inventario de bodega
// ============================================

const Inventario = require('../../models/inventario_bodega/inventario_bodega.model');

// ============================================
// OBTENER INVENTARIO COMPLETO
// ============================================
exports.obtenerInventario = async (req, res) => {
    try {
        const data = await Inventario.getInventario();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        res.status(500).json({ error: error.message });
    }
};