// ============================================
// CONTROLADOR: comodato.controller.js
// ============================================

const comodato = require('../../models/comodato/comodato.model');


// Crear nuevo comodato
exports.crear = async (req, res) => {
    const error = validarComodato(req.body);
    if (error) return res.status(400).json({ error });

    try {
        const resultado = await comodato.crear({
            ...req.body,
            registrado_por: req.user.id
        });
        res.json({ mensaje: 'Comodato creado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Listar comodatos activos
exports.listar = async (req, res) => {
    try {
        const { estado } = req.query;
        let data;
        
        if (estado) {
            data = await comodato.listarPorEstado(estado);
        } else {
            data = await comodato.listar();
        }
        
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Listar todos los comodatos
exports.listarTodos = async (req, res) => {
    try {
        const data = await comodato.listarTodos();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Obtener comodato por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await comodato.obtenerPorId(req.params.id);
        if (!data.rows.length)
            return res.status(404).json({ error: 'Comodato no encontrado' });
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Actualizar comodato
exports.actualizar = async (req, res) => {
    const error = validarComodato(req.body);
    if (error) return res.status(400).json({ error });

    try {
        const resultado = await comodato.actualizar(req.params.id, {
            ...req.body,
            actualizado_por: req.user.id
        });
        if (!resultado.rows.length)
            return res.status(404).json({ error: 'Comodato no encontrado' });
        res.json({ mensaje: 'Comodato actualizado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Cambiar estado y fecha de devolución
exports.cambiarEstado = async (req, res) => {
    const { estado, fecha_devolucion_real } = req.body;

    if (!estado) return res.status(400).json({ error: 'El estado es obligatorio' });

    try {
        const resultado = await comodato.cambiarEstado(req.params.id, estado, fecha_devolucion_real, req.user.id);
        if (!resultado.rows.length)
            return res.status(404).json({ error: 'Comodato no encontrado' });
        res.json({ mensaje: `Comodato actualizado a: ${estado}.`, data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Eliminar comodato
exports.eliminar = async (req, res) => {
    try {
        const resultado = await comodato.eliminar(req.params.id);
        if (!resultado.rows.length)
            return res.status(404).json({ error: 'Comodato no encontrado' });
        res.json({ mensaje: 'Comodato eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Obtener detalle completo para modal (con auditoría)
exports.obtenerDetalle = async (req, res) => {
    try {
        const data = await comodato.obtenerPorId(req.params.id);
        if (!data.rows.length)
            return res.status(404).json({ error: 'Comodato no encontrado' });
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Validación de comodato
function validarComodato(body) {
    const { fk_productor, superficie_ha, dias_prestamo } = body;

    if (!fk_productor) return 'El productor es obligatorio';
    if (!superficie_ha || superficie_ha <= 0) return 'La superficie debe ser mayor a 0';
    if (!dias_prestamo || dias_prestamo <= 0) return 'Los días de préstamo deben ser mayor a 0';

    return null;
}