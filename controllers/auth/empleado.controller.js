// ============================================
// CONTROLADOR: empleado.controller.js
// Descripción: CRUD de empleados
// ============================================

const Empleado         = require('../../models/auth/empleado.model');
const ContratoEmpleado = require('../../models/auth/contrato_empleado.model');
const MotivoBaja       = require('../../models/auth/motivo_baja.model');
const TipoContrato     = require('../../models/auth/tipo_contrato.model');

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
    try {
        const {
            numero_empleado, nombre, apellido_paterno, apellido_materno,
            sexo, telefono, correo, direccion, fecha_ingreso, fecha_nacimiento,
            fk_tipo_contrato  // ← nuevo campo requerido
        } = req.body;

        if (!nombre || !apellido_paterno || !numero_empleado) {
            return res.status(400).json({
                error: 'Número de empleado, nombre y apellido paterno son requeridos'
            });
        }

        if (!fk_tipo_contrato) {
            return res.status(400).json({ error: 'El tipo de contrato es requerido' });
        }

        if (!fecha_ingreso) {
            return res.status(400).json({ error: 'La fecha de ingreso es requerida' });
        }

        // Validar que el tipo de contrato exista
        const tipoContrato = await TipoContrato.obtenerPorId(fk_tipo_contrato);
        if (tipoContrato.rows.length === 0) {
            return res.status(400).json({ error: 'El tipo de contrato no existe' });
        }

        const existeNumero = await Empleado.existeNumero(numero_empleado);
        if (existeNumero.rows.length > 0) {
            return res.status(400).json({ error: 'El número de empleado ya está en uso' });
        }

        if (correo) {
            const existeCorreo = await Empleado.existeCorreo(correo);
            if (existeCorreo.rows.length > 0) {
                return res.status(400).json({ error: 'El correo ya está registrado' });
            }
        }

        // Crear empleado
        const result = await Empleado.crear({
            numero_empleado, nombre, apellido_paterno, apellido_materno,
            sexo, telefono, correo, direccion,
            estado: 'activo',
            fecha_ingreso:    fecha_ingreso    || null,
            fecha_nacimiento: fecha_nacimiento || null
        });

        const empleadoId = result.rows[0].pk_empleado;

        // Crear contrato automáticamente (fecha_inicio = fecha_ingreso)
        await ContratoEmpleado.crear(empleadoId, fk_tipo_contrato, fecha_ingreso);

        res.json({
            mensaje: 'Empleado creado exitosamente con su contrato inicial',
            empleadoId
        });

    } catch (error) {
        console.error('Error al crear empleado:', error);
        res.status(500).json({ error: error.message });
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
    try {
        const { fk_motivo_baja } = req.body;

        if (!fk_motivo_baja) {
            return res.status(400).json({ error: 'El motivo de baja es requerido' });
        }

        // Verificar que el empleado exista
        const empleado = await Empleado.obtenerPorId(req.params.id);
        if (empleado.rows.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        // No dar de baja si ya está inactivo
        if (empleado.rows[0].estado === 'inactivo') {
            return res.status(400).json({ error: 'El empleado ya está dado de baja' });
        }

        // Verificar que el motivo exista
        const motivo = await MotivoBaja.obtenerPorId(fk_motivo_baja);
        if (motivo.rows.length === 0) {
            return res.status(400).json({ error: 'El motivo de baja no existe' });
        }

        // Desactivar contrato activo
        await ContratoEmpleado.desactivarContrato(req.params.id);

        // Dar de baja al empleado
        await Empleado.darDeBaja(req.params.id, fk_motivo_baja);

        res.json({ mensaje: 'Empleado dado de baja exitosamente' });

    } catch (error) {
        console.error('Error al dar de baja al empleado:', error);
        res.status(500).json({ error: error.message });
    }
};

// ─── NUEVO: REACTIVAR empleado ────────────────────────────────────────────────
exports.reactivar = async (req, res) => {
    try {
        const { fk_tipo_contrato } = req.body;

        if (!fk_tipo_contrato) {
            return res.status(400).json({ error: 'El tipo de contrato es requerido para reactivar' });
        }

        // Verificar que el empleado exista
        const empleado = await Empleado.obtenerPorId(req.params.id);
        if (empleado.rows.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        // No reactivar si ya está activo
        if (empleado.rows[0].estado === 'activo') {
            return res.status(400).json({ error: 'El empleado ya está activo' });
        }

        // Validar que el tipo de contrato exista
        const tipoContrato = await TipoContrato.obtenerPorId(fk_tipo_contrato);
        if (tipoContrato.rows.length === 0) {
            return res.status(400).json({ error: 'El tipo de contrato no existe' });
        }

        // Reactivar empleado (limpia fecha_baja y motivo)
        await Empleado.reactivar(req.params.id);

        // Crear nuevo contrato desde hoy
        const hoy = new Date().toISOString().split('T')[0];
        await ContratoEmpleado.crear(req.params.id, fk_tipo_contrato, hoy);

        res.json({ mensaje: 'Empleado reactivado exitosamente con nuevo contrato' });

    } catch (error) {
        console.error('Error al reactivar empleado:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.renovarContrato = async (req, res) => {
    try {
        const { fk_tipo_contrato } = req.body;

        if (!fk_tipo_contrato) {
            return res.status(400).json({ error: 'El tipo de contrato es requerido' });
        }

        const empleado = await Empleado.obtenerPorId(req.params.id);
        if (empleado.rows.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        if (empleado.rows[0].estado !== 'activo') {
            return res.status(400).json({ error: 'Solo se puede renovar contrato a empleados activos' });
        }

        const tipoContrato = await TipoContrato.obtenerPorId(fk_tipo_contrato);
        if (tipoContrato.rows.length === 0) {
            return res.status(400).json({ error: 'El tipo de contrato no existe' });
        }

        // Desactivar contrato actual y crear uno nuevo
        await ContratoEmpleado.desactivarContrato(req.params.id);
        const hoy = new Date().toISOString().split('T')[0];
        await ContratoEmpleado.crear(req.params.id, fk_tipo_contrato, hoy);

        res.json({ mensaje: 'Contrato renovado exitosamente' });

    } catch (error) {
        console.error('Error al renovar contrato:', error);
        res.status(500).json({ error: error.message });
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