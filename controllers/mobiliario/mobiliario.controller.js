// ============================================
// CONTROLADOR: mobiliario.controller.js
// Descripción: Lógica de negocio para mobiliario
// ============================================

const Conexion         = require('../../config/database');
const mobiliarioModel  = require('../../models/mobiliario/mobiliario.model');

// ============================================
// Crear mueble
// ============================================
exports.crear = async (req, res) => {
    try {
        const { numero_economico, nombre, fk_ubicacion } = req.body;

        if (!numero_economico) return res.status(400).json({ error: 'El número económico es obligatorio' });
        if (!nombre)           return res.status(400).json({ error: 'El nombre es obligatorio' });
        if (!fk_ubicacion)     return res.status(400).json({ error: 'La ubicación es obligatoria' });

        const existe = await mobiliarioModel.existeNumeroEconomico(numero_economico);
        if (existe.rows.length) {
            return res.status(400).json({ error: 'Ya existe un mueble con ese número económico' });
        }

        const resultado = await mobiliarioModel.crear({ ...req.body, registrado_por: req.user.id });
        res.json({ mensaje: 'Mueble registrado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar muebles activos
// ============================================
exports.listar = async (req, res) => {
    try {
        const { nombre, estado_operativo, estado_fisico } = req.query;
        const data = await mobiliarioModel.listar({ nombre, estado_operativo, estado_fisico });
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar dados de baja
// ============================================
exports.listarBajas = async (req, res) => {
    try {
        const data = await mobiliarioModel.listarBajas();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar disponibles para préstamo
// ============================================
exports.listarDisponibles = async (req, res) => {
    try {
        const data = await mobiliarioModel.listarDisponibles();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Obtener por ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await mobiliarioModel.obtenerPorId(req.params.id);
        if (!data.rows.length) {
            return res.status(404).json({ error: 'Mueble no encontrado' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Actualizar mueble (datos generales)
// ============================================
exports.actualizar = async (req, res) => {
    try {
        const { numero_economico } = req.body;

        if (numero_economico) {
            const existe = await mobiliarioModel.existeNumeroEconomico(numero_economico, req.params.id);
            if (existe.rows.length) {
                return res.status(400).json({ error: 'Ya existe un mueble con ese número económico' });
            }
        }

        const resultado = await mobiliarioModel.actualizar(req.params.id, req.body);
        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Mueble no encontrado' });
        }
        res.json({ mensaje: 'Mueble actualizado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Dar de baja un mueble
// ============================================
exports.darBaja = async (req, res) => {
    const client = await Conexion.conectar().connect();
    try {
        const actual = await mobiliarioModel.obtenerPorId(req.params.id);
        if (!actual.rows.length) {
            return res.status(404).json({ error: 'Mueble no encontrado' });
        }
        if (actual.rows[0].estado_operativo === 'baja') {
            return res.status(400).json({ error: 'El mueble ya está dado de baja' });
        }
        if (actual.rows[0].estado_operativo === 'prestado') {
            return res.status(400).json({ error: 'No se puede dar de baja un mueble prestado' });
        }

        await client.query('BEGIN');
        await mobiliarioModel.cambiarEstadoOperativo(client, req.params.id, 'baja', req.user.id);
        await client.query('COMMIT');

        res.json({ mensaje: 'Mueble dado de baja exitosamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

// ============================================
// Enviar a mantenimiento
// ============================================
exports.enviarMantenimiento = async (req, res) => {
    const client = await Conexion.conectar().connect();
    try {
        const actual = await mobiliarioModel.obtenerPorId(req.params.id);
        if (!actual.rows.length) {
            return res.status(404).json({ error: 'Mueble no encontrado' });
        }
        if (actual.rows[0].estado_operativo === 'baja') {
            return res.status(400).json({ error: 'No se puede modificar un mueble en baja' });
        }
        if (actual.rows[0].estado_operativo === 'prestado') {
            return res.status(400).json({ error: 'No se puede enviar a mantenimiento un mueble prestado' });
        }

        await client.query('BEGIN');
        await mobiliarioModel.cambiarEstadoOperativo(client, req.params.id, 'mantenimiento', req.user.id);
        await client.query('COMMIT');

        res.json({ mensaje: 'Mueble enviado a mantenimiento exitosamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

// ============================================
// Regresar a disponible (desde mantenimiento)
// ============================================
exports.regresarDisponible = async (req, res) => {
    const client = await Conexion.conectar().connect();
    try {
        const actual = await mobiliarioModel.obtenerPorId(req.params.id);
        if (!actual.rows.length) {
            return res.status(404).json({ error: 'Mueble no encontrado' });
        }
        if (actual.rows[0].estado_operativo !== 'mantenimiento') {
            return res.status(400).json({ error: 'El mueble no está en mantenimiento' });
        }

        await client.query('BEGIN');
        await mobiliarioModel.cambiarEstadoOperativo(client, req.params.id, 'disponible', req.user.id);
        await client.query('COMMIT');

        res.json({ mensaje: 'Mueble disponible nuevamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};