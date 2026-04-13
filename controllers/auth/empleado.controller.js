// ============================================
// CONTROLADOR: empleado.controller.js
// Descripción: CRUD de empleados
// ============================================

const Empleado = require('../../models/auth/empleado.model');

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

// CREAR - Nuevo empleado
exports.crear = async (req, res) => {
    try {
        const {
            numero_empleado, nombre, apellido_paterno, apellido_materno,
            sexo, telefono, correo, direccion, fecha_ingreso, fecha_nacimiento
        } = req.body;

        if (!nombre || !apellido_paterno || !numero_empleado) {
            return res.status(400).json({
                error: 'Número de empleado, nombre y apellido paterno son requeridos'
            });
        }

        const existeNumero = await Empleado.existeNumero(numero_empleado);
        if (existeNumero.rows.length > 0) {
            return res.status(400).json({
                error: 'El número de empleado ya está en uso'
            });
        }

        if (correo) {
            const existeCorreo = await Empleado.existeCorreo(correo);
            if (existeCorreo.rows.length > 0) {
                return res.status(400).json({
                    error: 'El correo ya está registrado'
                });
            }
        }

        const result = await Empleado.crear({
            numero_empleado, nombre, apellido_paterno, apellido_materno,
            sexo, telefono, correo, direccion,
            estado: 'activo', // siempre activo al crear
            fecha_ingreso, fecha_nacimiento
        });

        res.json({
            mensaje: 'Empleado creado exitosamente',
            empleadoId: result.rows[0].pk_empleado
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
            fecha_ingreso, fecha_nacimiento
        });

        res.json({ mensaje: 'Empleado actualizado exitosamente' });

    } catch (error) {
        console.error('Error al actualizar empleado:', error);
        res.status(500).json({ error: error.message });
    }
};

// DESACTIVAR - Empleado (soft delete)
exports.desactivar = async (req, res) => {
    try {
        await Empleado.desactivar(req.params.id);
        res.json({ mensaje: 'Empleado desactivado exitosamente' });
    } catch (error) {
        console.error('Error al desactivar empleado:', error);
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