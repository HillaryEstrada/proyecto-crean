const proveedor = require('../../models/proveedor/proveedor.model');

exports.crear = async (req, res) => {
    try {
        const resultado = await proveedor.crear({
            ...req.body,
            registrado_por: req.user.id
        });
        res.json({ mensaje: 'Proveedor creado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.listar = async (req, res) => {
    try {
        const data = await proveedor.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.listarTodos = async (req, res) => {
    try {
        const data = await proveedor.listarTodos();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerPorId = async (req, res) => {
    try {
        const data = await proveedor.obtenerPorId(req.params.id);
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.actualizar = async (req, res) => {
    try {
        const resultado = await proveedor.actualizar(req.params.id, req.body);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }
        res.json({ mensaje: 'Proveedor actualizado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.desactivar = async (req, res) => {
    try {
        const resultado = await proveedor.desactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }
        res.json({ mensaje: 'Proveedor desactivado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.reactivar = async (req, res) => {
    try {
        const resultado = await proveedor.reactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }
        res.json({ mensaje: 'Proveedor reactivado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};