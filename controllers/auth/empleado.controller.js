// ============================================
// CONTROLADOR: empleado.controller.js
// Descripción: CRUD de empleados
// ============================================

const Empleado         = require('../../models/auth/empleado.model');
const ContratoEmpleado = require('../../models/auth/contrato_empleado.model');
const MotivoBaja       = require('../../models/auth/motivo_baja.model');
const TipoContrato     = require('../../models/auth/tipo_contrato.model');
const Conexion         = require('../../config/database');

// LISTAR - Todos los empleados
exports.listar = async (req, res) => {
    try {
        const data = await Empleado.listar();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar empleados:', error);
        res.status(500).json({ error: error.message });
    }
};

// OBTENER - Empleado por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await Empleado.obtenerPorId(req.params.id);
        if (data.rows.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        console.error('Error al obtener empleado:', error);
        res.status(500).json({ error: error.message });
    }
};

// CREAR - Nuevo empleado (+ contrato automático)
exports.crear = async (req, res) => {
    const {
        numero_empleado, nombre, apellido_paterno, apellido_materno,
        sexo, telefono, correo, direccion, fecha_ingreso, fecha_nacimiento,
        fk_tipo_contrato, regimen_laboral,
        numero_contrato, contrato_fecha_inicio, contrato_fecha_fin,
        justificacion, documento_contrato
    } = req.body;

    // ── Validaciones (fuera de transacción) ──
    if (!nombre || !apellido_paterno || !numero_empleado)
        return res.status(400).json({ error: 'Número de empleado, nombre y apellido paterno son requeridos' });
    if (!fk_tipo_contrato)
        return res.status(400).json({ error: 'El tipo de contrato es requerido' });
    if (!fecha_ingreso)
        return res.status(400).json({ error: 'La fecha de ingreso es requerida' });
    if (!regimen_laboral)
        return res.status(400).json({ error: 'El régimen laboral es requerido' });
    if (!numero_contrato)
        return res.status(400).json({ error: 'El número de contrato es requerido' });
    if (!contrato_fecha_inicio)
        return res.status(400).json({ error: 'La fecha de inicio del contrato es requerida' });
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
        return res.status(400).json({ error: 'El formato del correo no es válido' });
    if (telefono && telefono.replace(/\D/g, '').length !== 10)
        return res.status(400).json({ error: 'El teléfono debe tener exactamente 10 dígitos' });
    if (fecha_nacimiento && new Date(fecha_nacimiento) >= new Date())
        return res.status(400).json({ error: 'La fecha de nacimiento no puede ser futura' });
    if (new Date(contrato_fecha_inicio) < new Date(fecha_ingreso))
        return res.status(400).json({ error: 'La fecha de inicio del contrato no puede ser anterior a la fecha de ingreso' });
    if (contrato_fecha_fin && new Date(contrato_fecha_fin) <= new Date(contrato_fecha_inicio))
        return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' });

    const tipoContrato = await TipoContrato.obtenerPorId(fk_tipo_contrato);
    if (tipoContrato.rows.length === 0)
        return res.status(400).json({ error: 'El tipo de contrato no existe' });
    const existeNumero = await Empleado.existeNumero(numero_empleado);
    if (existeNumero.rows.length > 0)
        return res.status(400).json({ error: 'El número de empleado ya está en uso' });
    if (correo) {
        const existeCorreo = await Empleado.existeCorreo(correo);
        if (existeCorreo.rows.length > 0)
            return res.status(400).json({ error: 'El correo ya está registrado' });
    }
    const existeContrato = await ContratoEmpleado.existeNumeroContrato(numero_contrato);
    if (existeContrato.rows.length > 0)
        return res.status(400).json({ error: 'El número de contrato ya está en uso' });

    // ── Transacción ──
    const client = await Conexion.conectar().connect();
    try {
        await client.query('BEGIN');

        const empResult = await client.query(
            `INSERT INTO empleado
                (numero_empleado, nombre, apellido_paterno, apellido_materno,
                 sexo, telefono, correo, direccion, estado,
                 fecha_ingreso, fecha_nacimiento)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'activo',$9,$10)
             RETURNING pk_empleado`,
            [numero_empleado, nombre, apellido_paterno, apellido_materno || null,
             sexo || null, telefono || null, correo || null, direccion || null,
             fecha_ingreso, fecha_nacimiento || null]
        );
        const empleadoId = empResult.rows[0].pk_empleado;

        await client.query(
            `INSERT INTO contrato_empleado
                (fk_empleado, fk_tipo_contrato, fecha_inicio, fecha_fin, activo,
                numero_contrato, justificacion, documento_contrato, regimen_laboral, tipo_alta, estado_contrato, registrado_por)
            VALUES ($1,$2,$3,
                COALESCE($9::DATE, ($3::DATE + INTERVAL '6 months')::DATE),
                true,$4,$5,$6,$7,$8,'vigente',$10)`,
            [empleadoId, fk_tipo_contrato, contrato_fecha_inicio,
            numero_contrato, justificacion || null, documento_contrato || null,
            regimen_laboral, 'contratacion', contrato_fecha_fin || null,
            req.user?.id || null]
        );
        await client.query('COMMIT');
        res.json({ mensaje: 'Empleado creado exitosamente con su contrato inicial', empleadoId });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al crear empleado (ROLLBACK):', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

// ACTUALIZAR - Empleado existente
exports.actualizar = async (req, res) => {
    try {
        const {
            numero_empleado, nombre, apellido_paterno, apellido_materno,
            sexo, telefono, correo, direccion, estado, fecha_ingreso, fecha_nacimiento
        } = req.body;

        if (!nombre || !apellido_paterno || !numero_empleado) {
            return res.status(400).json({
                error: 'Número de empleado, nombre y apellido paterno son requeridos'
            });
        }

        const existeNumero = await Empleado.existeNumero(numero_empleado, req.params.id);
        if (existeNumero.rows.length > 0) {
            return res.status(400).json({
                error: 'El número de empleado ya está en uso por otro empleado'
            });
        }

        if (correo) {
            const existeCorreo = await Empleado.existeCorreo(correo, req.params.id);
            if (existeCorreo.rows.length > 0) {
                return res.status(400).json({
                    error: 'El correo ya está registrado por otro empleado'
                });
            }
        }

        // Correo y teléfono
        if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            return res.status(400).json({ error: 'El formato del correo no es válido' });
        }
        if (telefono && telefono.replace(/\D/g, '').length !== 10) {
            return res.status(400).json({ error: 'El teléfono debe tener exactamente 10 dígitos' });
        }
        if (fecha_nacimiento && new Date(fecha_nacimiento) >= new Date()) {
            return res.status(400).json({ error: 'La fecha de nacimiento no puede ser futura' });
        }

        await Empleado.actualizar(req.params.id, {
            numero_empleado, nombre, apellido_paterno, apellido_materno,
            sexo, telefono, correo, direccion, estado,
            fecha_ingreso:    fecha_ingreso    || null,
            fecha_nacimiento: fecha_nacimiento || null
        });

        res.json({ mensaje: 'Empleado actualizado exitosamente' });

    } catch (error) {
        console.error('Error al actualizar empleado:', error);
        res.status(500).json({ error: error.message });
    }
};

// DESACTIVAR - Empleado (soft delete, sin motivo — se mantiene para compatibilidad)
exports.desactivar = async (req, res) => {
    try {
        await Empleado.desactivar(req.params.id);
        res.json({ mensaje: 'Empleado desactivado exitosamente' });
    } catch (error) {
        console.error('Error al desactivar empleado:', error);
        res.status(500).json({ error: error.message });
    }
};

// ─── NUEVO: DAR DE BAJA con motivo ───────────────────────────────────────────
exports.darDeBaja = async (req, res) => {
    const { fk_motivo_baja } = req.body;

    if (!fk_motivo_baja)
        return res.status(400).json({ error: 'El motivo de baja es requerido' });

    const empleado = await Empleado.obtenerPorId(req.params.id);
    if (empleado.rows.length === 0)
        return res.status(404).json({ error: 'Empleado no encontrado' });
    if (empleado.rows[0].estado === 'inactivo')
        return res.status(400).json({ error: 'El empleado ya está dado de baja' });

    const motivo = await MotivoBaja.obtenerPorId(fk_motivo_baja);
    if (motivo.rows.length === 0)
        return res.status(400).json({ error: 'El motivo de baja no existe' });

    const client = await Conexion.conectar().connect();
    try {
        await client.query('BEGIN');

        await client.query(
            `UPDATE contrato_empleado
             SET activo = false, fecha_fin = COALESCE(fecha_fin, CURRENT_DATE), estado_contrato = 'cancelado'
             WHERE fk_empleado = $1 AND activo = true`,
            [req.params.id]
        );

        await client.query(
            `UPDATE empleado
             SET estado = 'inactivo', fk_motivo_baja = $2, fecha_baja = CURRENT_DATE
             WHERE pk_empleado = $1`,
            [req.params.id, fk_motivo_baja]
        );

        await client.query('COMMIT');
        res.json({ mensaje: 'Empleado dado de baja exitosamente' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al dar de baja (ROLLBACK):', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

// ─── NUEVO: REACTIVAR empleado ────────────────────────────────────────────────
exports.reactivar = async (req, res) => {
    const { fk_tipo_contrato, regimen_laboral, numero_contrato,
            fecha_inicio, fecha_fin, justificacion, documento_contrato } = req.body;

    if (!fk_tipo_contrato)
        return res.status(400).json({ error: 'El tipo de contrato es requerido para reactivar' });
    if (!fecha_inicio)
        return res.status(400).json({ error: 'La fecha de inicio del contrato es requerida' });
    if (fecha_fin && new Date(fecha_fin) <= new Date(fecha_inicio))
        return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' });

    const empleado = await Empleado.obtenerPorId(req.params.id);
    if (empleado.rows.length === 0)
        return res.status(404).json({ error: 'Empleado no encontrado' });
    if (empleado.rows[0].estado === 'activo')
        return res.status(400).json({ error: 'El empleado ya está activo' });

    const tipoContrato = await TipoContrato.obtenerPorId(fk_tipo_contrato);
    if (tipoContrato.rows.length === 0)
        return res.status(400).json({ error: 'El tipo de contrato no existe' });

    const client = await Conexion.conectar().connect();
    try {
        await client.query('BEGIN');

        // Limpiar alerta de contrato vencido si existe
        await client.query(
            `DELETE FROM alerta
            WHERE tipo_activo = 'empleado'
            AND tipo_alerta = 'contrato_vencido'
            AND fk_empleado = $1`,
            [req.params.id]
        );

        await client.query(
            `UPDATE empleado
             SET estado = 'activo', fk_motivo_baja = NULL, fecha_baja = NULL
             WHERE pk_empleado = $1`,
            [req.params.id]
        );

        await client.query(
            `INSERT INTO contrato_empleado
                (fk_empleado, fk_tipo_contrato, fecha_inicio, fecha_fin, activo,
                numero_contrato, justificacion, documento_contrato, regimen_laboral, tipo_alta, estado_contrato, registrado_por)
            VALUES ($1,$2,$3,
                COALESCE($9::DATE, ($3::DATE + INTERVAL '6 months')::DATE),
                true,$4,$5,$6,$7,$8,'vigente',$10)`,
            [req.params.id, fk_tipo_contrato, fecha_inicio,
            numero_contrato || null, justificacion || null, documento_contrato || null,
            regimen_laboral || null, 'recontratacion', fecha_fin || null,
            req.user?.id || null]
        );

        await client.query('COMMIT');
        res.json({ mensaje: 'Empleado reactivado exitosamente con nuevo contrato' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al reactivar empleado (ROLLBACK):', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

// RENOVAR CONTRATO
exports.renovarContrato = async (req, res) => {
    const { fk_tipo_contrato, numero_contrato, justificacion,
            documento_contrato, regimen_laboral, fecha_inicio, fecha_fin } = req.body;

    if (!fk_tipo_contrato)
        return res.status(400).json({ error: 'El tipo de contrato es requerido' });
    if (!fecha_inicio)
        return res.status(400).json({ error: 'La fecha de inicio del contrato es requerida' });
    if (fecha_fin && new Date(fecha_fin) <= new Date(fecha_inicio))
        return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' });

    const empleado = await Empleado.obtenerPorId(req.params.id);
    if (empleado.rows.length === 0)
        return res.status(404).json({ error: 'Empleado no encontrado' });
    if (empleado.rows[0].estado !== 'activo')
        return res.status(400).json({ error: 'Solo se puede renovar contrato a empleados activos' });

    const tipoContrato = await TipoContrato.obtenerPorId(fk_tipo_contrato);
    if (tipoContrato.rows.length === 0)
        return res.status(400).json({ error: 'El tipo de contrato no existe' });

    if (numero_contrato) {
        const existeContrato = await ContratoEmpleado.existeNumeroContrato(numero_contrato, req.params.id);
        if (existeContrato.rows.length > 0)
            return res.status(400).json({ error: 'El número de contrato ya está en uso' });
    }
    // Validar que la fecha de inicio no se empalme con el contrato activo
    const contratoActivo = await ContratoEmpleado.obtenerActivo(req.params.id);
    if (
        contratoActivo.rows.length > 0 &&
        contratoActivo.rows[0].fecha_fin &&
        new Date(fecha_inicio) <= new Date(contratoActivo.rows[0].fecha_fin)
    ) {
        return res.status(400).json({
            error: `La fecha de inicio debe ser posterior al fin del contrato actual (${
                new Date(contratoActivo.rows[0].fecha_fin).toLocaleDateString('es-MX')
            })`
        });
    }

    const client = await Conexion.conectar().connect();
    try {
        await client.query('BEGIN');

        // Limpiar alerta de contrato vencido si existe
        await client.query(
            `DELETE FROM alerta
            WHERE tipo_activo = 'empleado'
            AND tipo_alerta = 'contrato_vencido'
            AND fk_empleado = $1`,
            [req.params.id]
        );

        await client.query(
            `UPDATE contrato_empleado
             SET activo = false, fecha_fin = COALESCE(fecha_fin, CURRENT_DATE), estado_contrato = 'renovado'
             WHERE fk_empleado = $1 AND activo = true`,
            [req.params.id]
        );

        await client.query(
            `INSERT INTO contrato_empleado
                (fk_empleado, fk_tipo_contrato, fecha_inicio, fecha_fin, activo,
                numero_contrato, justificacion, documento_contrato, regimen_laboral, tipo_alta, estado_contrato, registrado_por)
            VALUES ($1,$2,$3,
                COALESCE($9::DATE, ($3::DATE + INTERVAL '6 months')::DATE),
                true,$4,$5,$6,$7,$8,'vigente',$10)`,
            [req.params.id, fk_tipo_contrato, fecha_inicio,
            numero_contrato || null, justificacion || null, documento_contrato || null,
            regimen_laboral || null, 'renovacion', fecha_fin || null,
            req.user?.id || null]
        );

        await client.query('COMMIT');
        res.json({ mensaje: 'Contrato renovado exitosamente' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al renovar contrato (ROLLBACK):', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

exports.listarBajas = async (req, res) => {
    try {
        const data = await Empleado.listarBajas();
        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.actualizarFoto = async (req, res) => {
    try {
        await Empleado.actualizarFoto(req.params.id, req.body.url);
        res.json({ mensaje: 'Foto actualizada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};