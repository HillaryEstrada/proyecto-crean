// ============================================
// CONTROLADOR: proveedor.controller.js
// Descripción: Funciones para gestionar proveedores
// ============================================

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
            const maquinaria = await proveedor.verificarMaquinariaActiva(req.params.id);
            const vehiculos  = await proveedor.verificarVehiculosActivos(req.params.id);

            const totalMaq = parseInt(maquinaria.rows[0].count);
            const totalVeh = parseInt(vehiculos.rows[0].count);

            if (totalMaq > 0 || totalVeh > 0) {
                const detalle = [];
                if (totalMaq > 0) detalle.push(`${totalMaq} maquinaria${totalMaq > 1 ? 's' : ''} activa${totalMaq > 1 ? 's' : ''}`);
                if (totalVeh > 0) detalle.push(`${totalVeh} vehículo${totalVeh > 1 ? 's' : ''} activo${totalVeh > 1 ? 's' : ''}`);
                return res.status(400).json({
                    error: `No se puede desactivar este proveedor porque tiene ${detalle.join(' y ')} asociados. Da de baja los equipos primero.`
                });
            }

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