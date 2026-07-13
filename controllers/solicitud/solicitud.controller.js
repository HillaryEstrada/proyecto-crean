// ============================================
// CONTROLADOR: solicitud.controller.js
// ============================================

const solicitud = require('../../models/solicitud/solicitud.model');


// Validación de campos según reglas del esquema (CHECK constraints)
function validarSolicitud(body) {
    const { fk_productor, superficie_ha, num_beneficiarios } = body;

    if (!fk_productor) return 'El campo fk_productor es obligatorio';

    if (superficie_ha !== undefined && superficie_ha !== null && superficie_ha <= 0)
        return 'superficie_ha debe ser mayor a 0';

    if (num_beneficiarios !== undefined && num_beneficiarios !== null && num_beneficiarios <= 0)
        return 'num_beneficiarios debe ser mayor a 0';

    return null;
}

// Validación de transición de estado
function validarEstado(estado) {
    const estadosValidos = ['pendiente', 'aprobada', 'rechazada', 'cancelada'];
    if (!estado) return 'El campo estado es obligatorio';
    if (!estadosValidos.includes(estado)) return `estado debe ser uno de: ${estadosValidos.join(', ')}`;
    return null;
}


// Crear una nueva solicitud
exports.crear = async (req, res) => {
    const error = validarSolicitud(req.body);
    if (error) return res.status(400).json({ error });

    try {
        const resultado = await solicitud.crear({
            ...req.body,
            registrado_por: req.user.id
        });
        res.json({ mensaje: 'Solicitud creada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        if (error.code === '23505')
            return res.status(400).json({ error: 'El folio ya existe' });
        res.status(500).json({ error: error.message });
    }
};


// Listar solicitudes activas (no canceladas)
exports.listar = async (req, res) => {
    try {
        const data = await solicitud.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Listar todas (incluye canceladas/rechazadas)
exports.listarTodas = async (req, res) => {
    try {
        const data = await solicitud.listarTodas();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Listar por estado (?estado=pendiente)
exports.listarPorEstado = async (req, res) => {
    const error = validarEstado(req.query.estado);
    if (error) return res.status(400).json({ error });

    try {
        const data = await solicitud.listarPorEstado(req.query.estado);
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Obtener solicitud por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await solicitud.obtenerPorId(req.params.id);
        if (!data.rows.length)
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Actualizar solicitud
exports.actualizar = async (req, res) => {
    const error = validarSolicitud(req.body);
    if (error) return res.status(400).json({ error });

    try {
        const resultado = await solicitud.actualizar(req.params.id, {
            ...req.body,
            actualizado_por: req.user.id
        });
        if (!resultado.rows.length)
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        res.json({ mensaje: 'Solicitud actualizada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        if (error.code === '23505')
            return res.status(400).json({ error: 'El folio ya está asignado a otra solicitud' });
        res.status(500).json({ error: error.message });
    }
};


// Cambiar estado (pendiente -> aprobada / rechazada / cancelada)
exports.cambiarEstado = async (req, res) => {
    const error = validarEstado(req.body.estado);
    if (error) return res.status(400).json({ error });

    try {
        const resultado = await solicitud.cambiarEstado(req.params.id, {
            estado: req.body.estado,
            actualizado_por: req.user.id
        });
        if (!resultado.rows.length)
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        res.json({ mensaje: `Solicitud marcada como: ${req.body.estado}`, data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Eliminar (baja lógica -> estado = cancelada)
exports.eliminar = async (req, res) => {
    try {
        const resultado = await solicitud.eliminar(req.params.id, req.user.id);
        if (!resultado.rows.length)
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        res.json({ mensaje: 'Solicitud eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};