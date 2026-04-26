// ============================================
// CONTROLADOR: partida_presupuestal.controller.js
// Descripción: Lógica de negocio para partida presupuestal
// ============================================

const partida = require('../../models/partida_presupuestal/partida_presupuestal.model');

// ============================================
// Crear partida presupuestal
// ============================================
exports.crear = async (req, res) => {
    try {
        // Verificar duplicado de clave
        const existeClave = await partida.existeClave(req.body.clave);
        if (existeClave.rows.length) {
            return res.status(400).json({ error: 'Ya existe una partida con esa clave' });
        }

        // Verificar duplicado de nombre
        const existeNombre = await partida.existeNombre(req.body.nombre);
        if (existeNombre.rows.length) {
            return res.status(400).json({ error: 'Ya existe una partida con ese nombre' });
        }

        const resultado = await partida.crear({ ...req.body, registrado_por: req.user.id });
        res.json({ mensaje: 'Partida presupuestal creada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar partidas activas
// ============================================
exports.listar = async (req, res) => {
    try {
        const data = await partida.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar todas las partidas (activas e inactivas)
// ============================================
exports.listarTodos = async (req, res) => {
    try {
        const data = await partida.listarTodos();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar partidas inactivas
// ============================================
exports.listarInactivos = async (req, res) => {
    try {
        const data = await partida.listarInactivos();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Obtener partida por clave
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await partida.obtenerPorId(req.params.id);
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Partida presupuestal no encontrada' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Actualizar partida presupuestal
// ============================================
exports.actualizar = async (req, res) => {
    try {
        // Verificar duplicado de clave (si cambió, que no exista ya)
        if (req.body.clave && req.body.clave !== req.params.id) {
            const existeClave = await partida.existeClave(req.body.clave);
            if (existeClave.rows.length) {
                return res.status(400).json({ error: 'Ya existe una partida con esa clave' });
            }
        }

        // Verificar duplicado de nombre (excluyendo la actual)
        if (req.body.nombre) {
            const existeNombre = await partida.existeNombre(req.body.nombre, req.params.id);
            if (existeNombre.rows.length) {
                return res.status(400).json({ error: 'Ya existe una partida con ese nombre' });
            }
        }

        const resultado = await partida.actualizar(req.params.id, req.body);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Partida presupuestal no encontrada' });
        }
        res.json({ mensaje: 'Partida presupuestal actualizada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Desactivar partida (baja lógica)
// ============================================
exports.desactivar = async (req, res) => {
    try {
        const resultado = await partida.desactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Partida presupuestal no encontrada' });
        }
        res.json({ mensaje: 'Partida presupuestal desactivada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Reactivar partida
// ============================================
exports.reactivar = async (req, res) => {
    try {
        const resultado = await partida.reactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Partida presupuestal no encontrada' });
        }
        res.json({ mensaje: 'Partida presupuestal reactivada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};