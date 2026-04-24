// ============================================
// CONTROLADOR: bodega_producto.controller.js
// Descripción: Maneja la lógica de negocio para productos de bodega
// ============================================

const Producto = require('../../models/bodega_producto/bodega_producto.model');

// ============================================
// CREAR PRODUCTO
// registrado_por viene del JWT (req.user.id)
// ============================================
exports.crear = async (req, res) => {
    try {
        // Verificar si el nombre ya existe
        const existe = await Producto.existeNombre(req.body.nombre);
        if (existe.rows.length) {
            return res.status(400).json({ error: 'Ya existe un producto con ese nombre' });
        }

        const resultado = await Producto.crear({
            ...req.body,
            registrado_por: req.user.id
        });
        res.json({
            mensaje: 'Producto creado exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// LISTAR PRODUCTOS ACTIVOS
// ============================================
exports.listar = async (req, res) => {
    try {
        const data = await Producto.listar();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar productos:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// LISTAR PRODUCTOS INACTIVOS
// ============================================
exports.listarInactivos = async (req, res) => {
    try {
        const data = await Producto.listarInactivos();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar productos inactivos:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// OBTENER PRODUCTO POR ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await Producto.obtenerPorId(req.params.id);
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// ACTUALIZAR PRODUCTO
// ============================================
exports.actualizar = async (req, res) => {
    try {
        // Verificar nombre duplicado en otro registro
        if (req.body.nombre) {
            const existe = await Producto.existeNombre(req.body.nombre);
            const duplicado = existe.rows.find(
                row => row.pk_producto !== parseInt(req.params.id)
            );
            if (duplicado) {
                return res.status(400).json({ error: 'Ya existe un producto con ese nombre' });
            }
        }

        const resultado = await Producto.actualizar(req.params.id, req.body);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({
            mensaje: 'Producto actualizado exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// DESACTIVAR — BAJA LÓGICA (estado = 0)
// ============================================
exports.desactivar = async (req, res) => {
    try {
        const resultado = await Producto.desactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({
            mensaje: 'Producto desactivado exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al desactivar producto:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// REACTIVAR (estado = 1)
// ============================================
exports.reactivar = async (req, res) => {
    try {
        const resultado = await Producto.reactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({
            mensaje: 'Producto reactivado exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al reactivar producto:', error);
        res.status(500).json({ error: error.message });
    }
};