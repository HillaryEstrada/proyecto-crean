// ============================================
// CONTROLADOR: almacen.controller.js
// Descripción: Lógica de negocio para almacen
// ============================================

const almacen = require('../../models/almacen/almacen.model');

// ============================================
// Crear almacen
// ============================================
exports.crear = async (req, res) => {
    try {
        // Verificar duplicado de nombre
        const existeNombre = await almacen.existeNombre(req.body.nombre);
        if (existeNombre.rows.length) {
            return res.status(400).json({ error: 'Ya existe un almacén con ese nombre' });
        }

        const resultado = await almacen.crear({ ...req.body, registrado_por: req.user.id });
        res.json({ mensaje: 'Almacén creado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar almacenes activos
// ============================================
exports.listar = async (req, res) => {
    try {
        const data = await almacen.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar todos los almacenes (activos e inactivos)
// ============================================
exports.listarTodos = async (req, res) => {
    try {
        const data = await almacen.listarTodos();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar almacenes inactivos
// ============================================
exports.listarInactivos = async (req, res) => {
    try {
        const data = await almacen.listarInactivos();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Obtener almacen por ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await almacen.obtenerPorId(req.params.id);
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Almacén no encontrado' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Actualizar almacen
// ============================================
exports.actualizar = async (req, res) => {
    try {
        // Verificar duplicado de nombre (excluyendo el actual)
        if (req.body.nombre) {
            const existeNombre = await almacen.existeNombre(req.body.nombre, req.params.id);
            if (existeNombre.rows.length) {
                return res.status(400).json({ error: 'Ya existe un almacén con ese nombre' });
            }
        }

        const resultado = await almacen.actualizar(req.params.id, req.body);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Almacén no encontrado' });
        }
        res.json({ mensaje: 'Almacén actualizado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Desactivar almacen (baja lógica)
// ============================================
exports.desactivar = async (req, res) => {
    try {
        const resultado = await almacen.desactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Almacén no encontrado' });
        }
        res.json({ mensaje: 'Almacén desactivado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Reactivar almacen
// ============================================
exports.reactivar = async (req, res) => {
    try {
        const resultado = await almacen.reactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Almacén no encontrado' });
        }
        res.json({ mensaje: 'Almacén reactivado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};