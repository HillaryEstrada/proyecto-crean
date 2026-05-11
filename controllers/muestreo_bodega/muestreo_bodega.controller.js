// ============================================
// CONTROLADOR: muestreo_bodega.controller.js
// Descripción: Lógica de negocio para muestreos de bodega
// ============================================

const Muestreo = require('../../models/muestreo_bodega/muestreo_bodega.model');

// ============================================
// CREAR MUESTREO
// ============================================
exports.crear = async (req, res) => {
    try {
        const { fk_bodega, fk_producto, fecha_muestreo } = req.body;

        if (!fk_bodega || !fk_producto || !fecha_muestreo) {
            return res.status(400).json({ error: 'Bodega, producto y fecha son requeridos' });
        }

        const resultado = await Muestreo.crear({
            ...req.body,
            registrado_por: req.user.id
        });

        res.json({ mensaje: 'Muestreo registrado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        console.error('Error al crear muestreo:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// LISTAR TODOS
// ============================================
exports.listar = async (req, res) => {
    try {
        const data = await Muestreo.listar();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar muestreos:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// LISTAR POR BODEGA + PRODUCTO
// GET /muestreo_bodega/historial/:fk_bodega/:fk_producto
// ============================================
exports.listarPorBodegaProducto = async (req, res) => {
    try {
        const { fk_bodega, fk_producto } = req.params;
        const data = await Muestreo.listarPorBodegaProducto(fk_bodega, fk_producto);
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar muestreos por bodega/producto:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// LISTAR POR BODEGA
// GET /muestreo_bodega/bodega/:fk_bodega
// ============================================
exports.listarPorBodega = async (req, res) => {
    try {
        const data = await Muestreo.listarPorBodega(req.params.fk_bodega);
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar muestreos por bodega:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// OBTENER POR ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await Muestreo.obtenerPorId(req.params.id);
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Muestreo no encontrado' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        console.error('Error al obtener muestreo:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// ACTUALIZAR
// ============================================
exports.actualizar = async (req, res) => {
    try {
        const resultado = await Muestreo.actualizar(req.params.id, req.body);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Muestreo no encontrado' });
        }
        res.json({ mensaje: 'Muestreo actualizado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        console.error('Error al actualizar muestreo:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// ELIMINAR
// ============================================
exports.eliminar = async (req, res) => {
    try {
        const resultado = await Muestreo.eliminar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Muestreo no encontrado' });
        }
        res.json({ mensaje: 'Muestreo eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar muestreo:', error);
        res.status(500).json({ error: error.message });
    }
};