// ============================================
// CONTROLADOR: vehiculo.controller.js
// Descripción: Maneja la lógica de negocio para vehiculo
// ============================================

const vehiculo = require('../../models/vehiculo/vehiculo.model');

// ============================================
// CONTROLADOR: CREAR VEHICULO
// ============================================
exports.crear = async (req, res) => {
    try {
        req.body.registrado_por = req.user.pk_user; 
        const resultado = await vehiculo.crear(req.body);
        res.json({
            mensaje: 'Vehículo creado exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: LISTAR VEHICULOS ACTIVOS
// ============================================
exports.listar = async (req, res) => {
    try {
        const data = await vehiculo.listar();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: OBTENER VEHICULO POR ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await vehiculo.obtenerPorId(req.params.id);

        if (!data.rows.length) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }

        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: ACTUALIZAR VEHICULO
// ============================================
exports.actualizar = async (req, res) => {
    try {
        const resultado = await vehiculo.actualizar(req.params.id, req.body);

        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }

        res.json({
            mensaje: 'Vehículo actualizado exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: DESACTIVAR (BAJA LÓGICA)
// ============================================
exports.desactivar = async (req, res) => {
    try {
        const resultado = await vehiculo.desactivar(req.params.id);

        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }

        res.json({
            mensaje: 'Vehículo dado de baja exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: LISTAR VEHICULOS DADOS DE BAJA
// ============================================
exports.listarBajas = async (req, res) => {
    try {
        const data = await vehiculo.listarBajas();
        res.json(data.rows);
    } catch (error) {
        console.error('Error en listarBajas:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: REGISTRAR BAJA EN HISTORIAL
// ============================================
exports.registrarBaja = async (req, res) => {
    try {
        const resultado = await vehiculo.registrarBaja(req.body);
        res.json({
            mensaje: 'Baja registrada exitosamente',
            data: resultado.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: LISTAR HISTORIAL DE BAJAS
// ============================================
exports.listarBajasRegistradas = async (req, res) => {
    try {
        const data = await vehiculo.listarBajasRegistradas();
        res.json(data.rows);
    } catch (error) {
        console.error('Error en listarBajasRegistradas:', error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: OBTENER BAJA POR ID (pk_baja)
// ============================================
exports.obtenerBajaPorId = async (req, res) => {
    try {
        const data = await vehiculo.obtenerBajaPorId(req.params.id);

        if (!data.rows.length) {
            return res.status(404).json({ error: 'Baja no encontrada' });
        }

        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};