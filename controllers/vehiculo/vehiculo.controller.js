// ============================================
// CONTROLADOR: vehiculo.controller.js
// Descripción: Maneja la lógica de negocio para vehículos
// ============================================

const Vehiculo = require('../../models/vehiculo/vehiculo.model');

// ============================================
// CREAR VEHÍCULO
// registrado_por viene del JWT (req.user.id)
// ============================================
exports.crear = async (req, res) => {
    try {
        const resultado = await Vehiculo.crear({
            ...req.body,
            registrado_por: req.user.id
        });
        res.json({
            mensaje: 'Vehículo creado exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al crear vehículo:', error);
        const msg = _mensajeDuplicado(error) || error.message;
        res.status(500).json({ error: msg });
    }
};

// ============================================
// LISTAR VEHÍCULOS ACTIVOS
// ============================================
exports.listar = async (req, res) => {
    try {
        const data = await Vehiculo.listar();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar vehículos:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// OBTENER VEHÍCULO POR ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await Vehiculo.obtenerPorId(req.params.id);
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        console.error('Error al obtener vehículo:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// ACTUALIZAR VEHÍCULO
// ============================================
exports.actualizar = async (req, res) => {
    try {
        const resultado = await Vehiculo.actualizar(req.params.id, req.body);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }
        res.json({
            mensaje: 'Vehículo actualizado exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar vehículo:', error);
        const msg = _mensajeDuplicado(error) || error.message;
        res.status(500).json({ error: msg });
    }
};

// ============================================
// DESACTIVAR — BAJA LÓGICA
// Cambia estado_operativo a 'baja'
// ============================================
exports.desactivar = async (req, res) => {
    try {
        const resultado = await Vehiculo.desactivar(req.params.id);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }
        res.json({
            mensaje: 'Vehículo dado de baja exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al desactivar vehículo:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// LISTAR VEHÍCULOS DADOS DE BAJA
// ============================================
exports.listarBajas = async (req, res) => {
    try {
        const data = await Vehiculo.listarBajas();
        res.json(data.rows);
    } catch (error) {
        console.error('Error en listarBajas:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// REGISTRAR BAJA EN HISTORIAL
// registrado_por viene del JWT
// ============================================
exports.registrarBaja = async (req, res) => {
    try {
        const resultado = await Vehiculo.registrarBaja({
            ...req.body,
            registrado_por: req.user.id
        });
        res.json({
            mensaje: 'Baja registrada exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al registrar baja:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// LISTAR HISTORIAL DE BAJAS REGISTRADAS
// ============================================
exports.listarBajasRegistradas = async (req, res) => {
    try {
        const data = await Vehiculo.listarBajasRegistradas();
        res.json(data.rows);
    } catch (error) {
        console.error('Error en listarBajasRegistradas:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// OBTENER BAJA POR ID
// ============================================
exports.obtenerBajaPorId = async (req, res) => {
    try {
        const data = await Vehiculo.obtenerBajaPorId(req.params.id);
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Baja no encontrada' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        console.error('Error al obtener baja:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.actualizarBaja = async (req, res) => {
    try {
        const resultado = await Vehiculo.actualizarBaja(req.params.id, req.body);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Baja no encontrada' });
        }
        res.json({ mensaje: 'Baja actualizada exitosamente', data: resultado.rows[0] });
    } catch (error) {
        console.error('Error al actualizar baja:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// HELPER: mensajes amigables para duplicate key
// ============================================
function _mensajeDuplicado(error) {
    if (!error.message.includes('duplicate key')) return null;
    if (error.message.includes('numero_economico')) return 'El número económico ya existe, usa uno diferente';
    if (error.message.includes('numero_inventario_gob')) return 'El N° de inventario GOB ya existe, usa uno diferente';
    if (error.message.includes('vin'))    return 'El VIN ya está registrado en otro vehículo';
    if (error.message.includes('placas')) return 'Las placas ya están registradas en otro vehículo';
    return 'Ya existe un registro con ese valor, verifica los campos únicos';
}