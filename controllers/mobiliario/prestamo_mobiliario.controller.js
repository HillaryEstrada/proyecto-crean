// ============================================
// CONTROLADOR: prestamo_mobiliario.controller.js
// ============================================

const Conexion        = require('../../config/database');
const prestamoModel   = require('../../models/mobiliario/prestamo_mobiliario.model');
const mobiliarioModel = require('../../models/mobiliario/mobiliario.model');

// ============================================
// Crear préstamo con sus muebles
// ============================================
exports.crear = async (req, res) => {
    const client = await Conexion.conectar().connect();
    try {
        const { fk_responsable, fecha_inicio, fecha_fin, motivo, mobiliarios } = req.body;

        if (!fecha_inicio)                        return res.status(400).json({ error: 'La fecha de inicio es obligatoria' });
        if (!Array.isArray(mobiliarios) || !mobiliarios.length)
            return res.status(400).json({ error: 'Debes seleccionar al menos un mueble' });

        // Verificar que todos estén disponibles antes de iniciar transacción
        for (const id of mobiliarios) {
            const m = await mobiliarioModel.obtenerPorId(id);
            if (!m.rows.length) {
                return res.status(404).json({ error: `Mueble con ID ${id} no encontrado` });
            }
            const estado = m.rows[0].estado_operativo;
            if (estado === 'prestado')     return res.status(400).json({ error: `"${m.rows[0].nombre}" ya está prestado` });
            if (estado === 'baja')         return res.status(400).json({ error: `"${m.rows[0].nombre}" está dado de baja` });
            if (estado === 'mantenimiento') return res.status(400).json({ error: `"${m.rows[0].nombre}" está en mantenimiento` });
        }

        await client.query('BEGIN');

        // Crear préstamo
        const prestamo = await prestamoModel.crear(client, {
            fk_responsable: fk_responsable || null,
            fecha_inicio,
            fecha_fin:      fecha_fin      || null,
            motivo:         motivo         || null,
            registrado_por: req.user.id
        });

        const pk_prestamo = prestamo.rows[0].pk_prestamo;

        // Agregar muebles — el trigger fn_prestamo_estado cambia estado a "prestado"
        for (const id of mobiliarios) {
            await prestamoModel.agregarDetalle(client, pk_prestamo, id);
        }

        await client.query('COMMIT');

        res.json({ mensaje: 'Préstamo registrado exitosamente', data: prestamo.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

// ============================================
// Listar préstamos activos
// ============================================
exports.listarActivos = async (req, res) => {
    try {
        const data = await prestamoModel.listarActivos();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Listar todos (historial) con filtro de estado
// ============================================
exports.listarTodos = async (req, res) => {
    try {
        const { estado } = req.query;
        const data = await prestamoModel.listarTodos({ estado });
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Obtener detalle de préstamo (qué muebles incluye)
// ============================================
exports.obtenerDetalle = async (req, res) => {
    try {
        const data = await prestamoModel.obtenerDetalle(req.params.id);
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Finalizar préstamo → regresa muebles a "disponible"
// ============================================
exports.finalizar = async (req, res) => {
    const client = await Conexion.conectar().connect();
    try {
        const prestamo = await prestamoModel.obtenerPorId(req.params.id);
        if (!prestamo.rows.length) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }
        if (prestamo.rows[0].estado !== 'activo') {
            return res.status(400).json({ error: 'El préstamo no está activo' });
        }

        await client.query('BEGIN');
        // El trigger fn_prestamo_devolucion regresa los muebles a "disponible"
        await prestamoModel.cambiarEstado(client, req.params.id, 'finalizado');
        await client.query('COMMIT');

        res.json({ mensaje: 'Préstamo finalizado exitosamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

// ============================================
// Cancelar préstamo → regresa muebles a "disponible"
// ============================================
exports.cancelar = async (req, res) => {
    const client = await Conexion.conectar().connect();
    try {
        const prestamo = await prestamoModel.obtenerPorId(req.params.id);
        if (!prestamo.rows.length) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }
        if (prestamo.rows[0].estado !== 'activo') {
            return res.status(400).json({ error: 'El préstamo no está activo' });
        }

        await client.query('BEGIN');
        // Al cambiar a "cancelado", necesitamos regresar manualmente los muebles a disponible
        const detalle = await prestamoModel.obtenerDetalle(req.params.id);
        for (const d of detalle.rows) {
            await mobiliarioModel.cambiarEstadoOperativo(client, d.fk_mobiliario, 'disponible', req.user.id);
        }
        await prestamoModel.cambiarEstado(client, req.params.id, 'cancelado');
        await client.query('COMMIT');

        res.json({ mensaje: 'Préstamo cancelado exitosamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};