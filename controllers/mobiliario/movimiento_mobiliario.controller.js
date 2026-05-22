// ============================================
// CONTROLADOR: movimiento_mobiliario.controller.js
// ============================================
const Conexion        = require('../../config/database');
const mobiliarioModel = require('../../models/mobiliario/mobiliario.model');
const movimientoModel = require('../../models/mobiliario/movimiento_mobiliario.model');

// ============================================
// Historial por mueble
// ============================================
exports.historialPorMobiliario = async (req, res) => {
    try {
        const data = await movimientoModel.historialPorMobiliario(req.params.id);
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Historial general
// ============================================
exports.historialGeneral = async (req, res) => {
    try {
        const { tipo, fecha_inicio, fecha_fin } = req.query;
        const data = await movimientoModel.historialGeneral({ tipo, fecha_inicio, fecha_fin });
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.registrarMovimiento = async (req, res) => {
    const client = await Conexion.conectar().connect();
    try {
        const { fk_mobiliario, tipo_movimiento, fk_responsable_nuevo,
                fk_ubicacion_nueva, motivo } = req.body;

        const tipos_validos = ['asignacion', 'reasignacion', 'traslado'];
        if (!tipos_validos.includes(tipo_movimiento))
            return res.status(400).json({ error: 'Tipo de movimiento inválido' });
        if (!fk_mobiliario)
            return res.status(400).json({ error: 'El mueble es obligatorio' });

        // Obtener estado actual del mueble
        const actual = await mobiliarioModel.obtenerPorId(fk_mobiliario);
        if (!actual.rows.length)
            return res.status(404).json({ error: 'Mueble no encontrado' });
        const m = actual.rows[0];

        await client.query('BEGIN');

        // Registrar movimiento
        await movimientoModel.registrar(client, {
            fk_mobiliario,
            tipo_movimiento,
            fk_responsable_anterior: m.fk_responsable,
            fk_responsable_nuevo:    fk_responsable_nuevo || null,
            fk_ubicacion_anterior:   m.fk_ubicacion,
            fk_ubicacion_nueva:      fk_ubicacion_nueva   || null,
            motivo,
            registrado_por: req.user.id
        });

        // Actualizar mueble si hay cambios de responsable/ubicación
        if (fk_responsable_nuevo || fk_ubicacion_nueva) {
            await client.query(
                `UPDATE mobiliario SET
                    fk_responsable = COALESCE($1, fk_responsable),
                    fk_ubicacion   = COALESCE($2, fk_ubicacion)
                 WHERE pk_mobiliario = $3`,
                [fk_responsable_nuevo || null, fk_ubicacion_nueva || null, fk_mobiliario]
            );
        }

        await client.query('COMMIT');
        res.json({ mensaje: 'Movimiento registrado exitosamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};