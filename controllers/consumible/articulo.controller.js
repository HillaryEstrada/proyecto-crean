// ============================================
// CONTROLADOR: articulo.controller.js
// Descripción: Lógica de negocio para artículos
// ============================================

const articulo = require('../../models/consumible/articulo.model');

// ============================================
// Crear artículo
// ============================================
exports.crear = async (req, res) => {
    try {
        const { nombre, fk_unidad, fk_almacen } = req.body;

        if (!nombre)     return res.status(400).json({ error: 'El nombre es obligatorio' });
        if (!fk_unidad)  return res.status(400).json({ error: 'La unidad de medida es obligatoria' });
        if (!fk_almacen) return res.status(400).json({ error: 'El almacén es obligatorio' });

        const existe = await articulo.existeNombre(nombre);
        if (existe.rows.length) {
            return res.status(400).json({ error: 'Ya existe un artículo con ese nombre' });
        }

        const resultado = await articulo.crear({ ...req.body, registrado_por: req.user.id });
        res.json({ mensaje: 'Artículo creado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar artículos activos
// ============================================
exports.listar = async (req, res) => {
    try {
        const { nombre, categoria } = req.query;
        const data = await articulo.listar({ nombre, categoria });
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar artículos inactivos
// ============================================
exports.listarInactivos = async (req, res) => {
    try {
        const data = await articulo.listarInactivos();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar artículos con stock bajo
// ============================================
exports.stockBajo = async (req, res) => {
    try {
        const data = await articulo.listarStockBajo();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Obtener artículo por ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await articulo.obtenerPorId(req.params.id);
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Actualizar artículo (sin tocar stock)
// ============================================
exports.actualizar = async (req, res) => {
    try {
        const { nombre } = req.body;

        if (nombre) {
            const existe = await articulo.existeNombre(nombre, req.params.id);
            if (existe.rows.length) {
                return res.status(400).json({ error: 'Ya existe un artículo con ese nombre' });
            }
        }

        const resultado = await articulo.actualizar(req.params.id, req.body);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }
        res.json({ mensaje: 'Artículo actualizado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Desactivar artículo (baja lógica)
// ============================================
exports.desactivar = async (req, res) => {
    try {
        const resultado = await articulo.desactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }
        res.json({ mensaje: 'Artículo desactivado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Reactivar artículo
// ============================================
exports.reactivar = async (req, res) => {
    try {
        const resultado = await articulo.reactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }
        res.json({ mensaje: 'Artículo reactivado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar categorías únicas
// ============================================
exports.listarCategorias = async (req, res) => {
    try {
        const data = await articulo.listarCategorias();
        res.json(data.rows.map(r => r.categoria));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};