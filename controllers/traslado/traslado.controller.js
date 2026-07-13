// ============================================
// CONTROLADOR: traslado.controller.js
// ============================================

const Traslado = require('../../models/traslado/traslado.model');

// Validación de campos obligatorios
function validarTraslado(body) {
    const { fk_comodato, destino, tipo } = body;
    if (!fk_comodato) return 'El campo fk_comodato es obligatorio';
    if (!destino)     return 'El campo destino es obligatorio';
    if (!tipo)        return 'El campo tipo es obligatorio';
    if (!['entrega', 'recoleccion'].includes(tipo))
        return 'tipo debe ser entrega o recoleccion';
    return null;
}

// Listar traslados activos (sin fecha_llegada)
exports.listar = async (req, res) => {
    try {
        const data = await Traslado.listar();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar traslados:', error);
        res.status(500).json({ error: error.message });
    }
};

// Listar todos los traslados
exports.listarTodos = async (req, res) => {
    try {
        const data = await Traslado.listarTodos();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar todos los traslados:', error);
        res.status(500).json({ error: error.message });
    }
};

// Obtener traslado por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await Traslado.obtenerPorId(req.params.id);
        if (!data.rows.length)
            return res.status(404).json({ error: 'Traslado no encontrado' });
        res.json(data.rows[0]);
    } catch (error) {
        console.error('Error al obtener traslado:', error);
        res.status(500).json({ error: error.message });
    }
};

// Listar traslados por comodato
exports.listarPorComodato = async (req, res) => {
    try {
        const data = await Traslado.listarPorComodato(req.params.fk_comodato);
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar traslados por comodato:', error);
        res.status(500).json({ error: error.message });
    }
};

// Crear traslado
exports.crear = async (req, res) => {
    const error = validarTraslado(req.body);
    if (error) return res.status(400).json({ error });

    try {
        const resultado = await Traslado.crear({
            ...req.body,
            registrado_por: req.user.id
        });
        res.json({ mensaje: 'Traslado registrado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        console.error('Error al crear traslado:', error);
        res.status(500).json({ error: error.message });
    }
};

// Actualizar traslado
exports.actualizar = async (req, res) => {
    try {
        const resultado = await Traslado.actualizar(req.params.id, {
            ...req.body,
            actualizado_por: req.user.id
        });
        if (!resultado.rows.length)
            return res.status(404).json({ error: 'Traslado no encontrado' });
        res.json({ mensaje: 'Traslado actualizado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        console.error('Error al actualizar traslado:', error);
        res.status(500).json({ error: error.message });
    }
};

// Registrar llegada (cierre del traslado)
exports.registrarLlegada = async (req, res) => {
    try {
        const resultado = await Traslado.registrarLlegada(req.params.id, {
            ...req.body,
            actualizado_por: req.user.id
        });
        if (!resultado.rows.length)
            return res.status(404).json({ error: 'Traslado no encontrado' });
        res.json({ mensaje: 'Llegada registrada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        console.error('Error al registrar llegada:', error);
        res.status(500).json({ error: error.message });
    }
};

// Eliminar traslado (DELETE físico)
exports.eliminar = async (req, res) => {
    try {
        const resultado = await Traslado.eliminar(req.params.id);
        if (!resultado.rows.length)
            return res.status(404).json({ error: 'Traslado no encontrado' });
        res.json({ mensaje: 'Traslado eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar traslado:', error);
        res.status(500).json({ error: error.message });
    }
};