// ============================================
// CONTROLADOR: contrato_empleado.controller.js
// Descripción: Consultas de historial de contratos (controlado/interno)
// ============================================

const ContratoEmpleado = require('../../models/auth/contrato_empleado.model');
const Empleado         = require('../../models/auth/empleado.model');

// LISTAR - Historial de contratos de un empleado
exports.listarPorEmpleado = async (req, res) => {
    try {
        const empleado = await Empleado.obtenerPorId(req.params.id);
        if (empleado.rows.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        const data = await ContratoEmpleado.listarPorEmpleado(req.params.id);
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar contratos del empleado:', error);
        res.status(500).json({ error: error.message });
    }
};

// OBTENER ACTIVO - Contrato activo de un empleado
exports.obtenerActivo = async (req, res) => {
    try {
        const empleado = await Empleado.obtenerPorId(req.params.id);
        if (empleado.rows.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        const data = await ContratoEmpleado.obtenerActivo(req.params.id);
        if (data.rows.length === 0) {
            return res.status(404).json({ error: 'El empleado no tiene un contrato activo' });
        }

        res.json(data.rows[0]);
    } catch (error) {
        console.error('Error al obtener contrato activo:', error);
        res.status(500).json({ error: error.message });
    }
};