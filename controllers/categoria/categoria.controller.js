// ============================================
// CONTROLADOR: categoria.controller.js
// Descripción: Lógica de negocio para categorías de consumibles
// ============================================

const categoria = require('../../models/categoria/categoria.model');

// ============================================
// Crear categoría
// ============================================
exports.crear = async (req, res) => {
    try {
        // Verificar duplicado de clave
        const existeClave = await categoria.existeClave(req.body.clave);
        if (existeClave.rows.length) {
            return res.status(400).json({ error: 'Ya existe una categoría con esa clave' });
        }

        // Verificar duplicado de nombre
        const existeNombre = await categoria.existeNombre(req.body.nombre);
        if (existeNombre.rows.length) {
            return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
        }

        const resultado = await categoria.crear({ ...req.body, registrado_por: req.user.id });
        res.json({ mensaje: 'Categoría creada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar categorías activas
// ============================================
exports.listar = async (req, res) => {
    try {
        const data = await categoria.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar todas las categorías (activas e inactivas)
// ============================================
exports.listarTodos = async (req, res) => {
    try {
        const data = await categoria.listarTodos();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar categorías inactivas
// ============================================
exports.listarInactivos = async (req, res) => {
    try {
        const data = await categoria.listarInactivos();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Obtener categoría por clave
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await categoria.obtenerPorId(req.params.id);
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Actualizar categoría
// ============================================
exports.actualizar = async (req, res) => {
    try {
        // Verificar duplicado de clave (excluyendo la categoría actual)
        if (req.body.clave) {
            const existeClave = await categoria.existeClave(req.body.clave, req.params.id);
            if (existeClave.rows.length) {
                return res.status(400).json({ error: 'Ya existe una categoría con esa clave' });
            }
        }

        // Verificar duplicado de nombre (excluyendo la actual)
        if (req.body.nombre) {
            const existeNombre = await categoria.existeNombre(req.body.nombre, req.params.id);
            if (existeNombre.rows.length) {
                return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
            }
        }

        const resultado = await categoria.actualizar(req.params.id, req.body);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        res.json({ mensaje: 'Categoría actualizada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Desactivar categoría (baja lógica)
// ============================================
exports.desactivar = async (req, res) => {
    try {
        const enUso = await categoria.estaEnUso(req.params.id);
        if (enUso.rows[0].total > 0) {
            return res.status(400).json({
                error: `No se puede desactivar esta categoría porque tiene ${enUso.rows[0].total} artículo(s) de inventario asociados.`
            });
        }

        const resultado = await categoria.desactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        res.json({ mensaje: 'Categoría desactivada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Reactivar categoría
// ============================================
exports.reactivar = async (req, res) => {
    try {
        const resultado = await categoria.reactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        res.json({ mensaje: 'Categoría reactivada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};