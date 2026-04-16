// ============================================
// CONTROLADOR: factura.controller.js
// ============================================

const factura = require('../../models/factura/factura.model');


// Crear una nueva factura
exports.crear = async (req, res) => {
    try {
        const resultado = await factura.crear(req.body);
        res.json({
            mensaje: 'Factura creada exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {

        
        if (error.code === '23505') {
            return res.status(400).json({
                error: 'El número de factura ya existe'
            });
        }

        res.status(500).json({ error: error.message });
    }
};


// Listar facturas activas
exports.listar = async (req, res) => {
    try {
        const data = await factura.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Listar todas (activas e inactivas)
exports.listarTodas = async (req, res) => {
    try {
        const data = await factura.listarTodas();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Obtener factura por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await factura.obtenerPorId(req.params.id);
        
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }
        
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Actualizar factura
exports.actualizar = async (req, res) => {
    try {
        const resultado = await factura.actualizar(req.params.id, req.body);
        
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }
        
        res.json({
            mensaje: 'Factura actualizada exitosamente',
            data: resultado.rows[0]
        });

    } catch (error) {

        if (error.code === '23505') {
            return res.status(400).json({
                error: 'El número de factura ya está asignado a otra factura'
            });
        }

        res.status(500).json({ error: error.message });
    }
};