// ============================================
// CONTROLADOR: factura.controller.js
// ============================================

const factura = require('../../models/factura/factura.model');


// Crear una nueva factura
exports.crear = async (req, res) => {
    const error = validarGarantia(req.body);
    if (error) return res.status(400).json({ error });

    try {
        const resultado = await factura.crear({
            ...req.body,
            registrado_por: req.user.id
        });
        res.json({ mensaje: 'Factura creada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        if (error.code === '23505')
            return res.status(400).json({ error: 'El número de factura ya existe' });
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
        if (!data.rows.length)
            return res.status(404).json({ error: 'Factura no encontrada' });
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Actualizar factura
exports.actualizar = async (req, res) => {
    const error = validarGarantia(req.body);
    if (error) return res.status(400).json({ error });

    try {
        const resultado = await factura.actualizar(req.params.id, req.body);
        if (!resultado.rows.length)
            return res.status(404).json({ error: 'Factura no encontrada' });
        res.json({ mensaje: 'Factura actualizada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        if (error.code === '23505')
            return res.status(400).json({ error: 'El número de factura ya está asignado a otra factura' });
        res.status(500).json({ error: error.message });
    }
};

// Validación de garantía según tipo_activo
function validarGarantia(body) {
    const { tipo_activo, garantia_duracion_dias, garantia_limite_horas, garantia_limite_km } = body;

    if (!tipo_activo) return 'El campo tipo_activo es obligatorio';

    if (tipo_activo === 'maquinaria' && garantia_limite_km) 
        return 'Maquinaria no puede tener garantia_limite_km';

    if (tipo_activo === 'vehiculo' && garantia_limite_horas)
        return 'Vehículo no puede tener garantia_limite_horas';

    if (!garantia_duracion_dias && !garantia_limite_horas && !garantia_limite_km)
        return 'Debe indicar al menos una condición de garantía (días, horas o km)';

    return null;
}

