// ============================================
// MIDDLEWARE: vehiculo.middleware.js
// Descripción: Validaciones para vehículo
// ============================================

const Conexion = require('../config/database');

// ============================================
// CONFIGURACIÓN DE VALIDACIONES
// ============================================
const fkValidaciones = [
    { campo: 'fk_tipo',      tabla: 'tipo_equipo', pk: 'pk_tipo_equipo', mensaje: 'El tipo de equipo no existe' },
    { campo: 'fk_ubicacion', tabla: 'ubicacion',   pk: 'pk_ubicacion',   mensaje: 'La ubicación no existe' },
    { campo: 'fk_factura',   tabla: 'factura',      pk: 'pk_factura',     mensaje: 'La factura no existe' },
    { campo: 'fk_garantia',  tabla: 'garantia',     pk: 'pk_garantia',    mensaje: 'La garantía no existe' }
];

const camposUnicos = [
    { campo: 'numero_economico',    mensaje: 'El número económico ya está en uso' },
    { campo: 'numero_inventario_gob', mensaje: 'El número de inventario ya está en uso' }
];

// Campos obligatorios solo para CREATE
const camposRequeridosCrear = [
    'numero_economico',
    'fk_tipo',
    'marca',
    'modelo',
    'anio',
    'kilometraje_actual',
    'gasolina_litros',
    'estado_fisico',
    'estado_operativo',
    'fk_ubicacion'
];

// ============================================
// HELPER: VALIDAR QUE BODY EXISTA
// ============================================
const validarBody = (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        res.status(400).json({ error: 'Body vacío o mal enviado (JSON requerido)' });
        return false;
    }
    return true;
};

// ============================================
// MIDDLEWARE: VALIDAR CAMPOS REQUERIDOS (CREATE)
// ============================================
exports.validarCamposRequeridosCrear = (req, res, next) => {
    if (!validarBody(req, res)) return;

    for (const campo of camposRequeridosCrear) {
        if (
            req.body[campo] === undefined ||
            req.body[campo] === null ||
            req.body[campo] === ''
        ) {
            return res.status(400).json({ error: `El campo ${campo} es requerido` });
        }
    }

    next();
};

// ============================================
// MIDDLEWARE: VALIDAR FK
// ============================================
exports.validarFKVehiculo = async (req, res, next) => {
    try {
        if (!validarBody(req, res)) return;

        for (const validacion of fkValidaciones) {
            if (
                req.body[validacion.campo] !== undefined &&
                req.body[validacion.campo] !== null
            ) {
                const resultado = await Conexion.query(
                    `SELECT ${validacion.pk} FROM ${validacion.tabla} WHERE ${validacion.pk} = $1`,
                    [req.body[validacion.campo]]
                );

                if (!resultado.rows.length) {
                    return res.status(400).json({ error: validacion.mensaje });
                }
            }
        }

        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// MIDDLEWARE: VALIDAR CAMPOS ÚNICOS
// ============================================
exports.validarCamposUnicosVehiculo = async (req, res, next) => {
    try {
        if (!validarBody(req, res)) return;

        const id = req.params.id;

        for (const item of camposUnicos) {
            if (
                req.body[item.campo] !== undefined &&
                req.body[item.campo] !== null &&
                req.body[item.campo] !== ''
            ) {
                let query  = `SELECT pk_vehiculo FROM vehiculo WHERE ${item.campo} = $1`;
                let params = [req.body[item.campo]];

                if (id) {
                    query += ` AND pk_vehiculo != $2`;
                    params.push(id);
                }

                const existe = await Conexion.query(query, params);

                if (existe.rows.length) {
                    return res.status(400).json({ error: item.mensaje });
                }
            }
        }

        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// MIDDLEWARE: VALIDAR QUE NO ESTÉ DE BAJA
// ============================================
exports.validarNoBaja = async (req, res, next) => {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(400).json({ error: 'ID es requerido' });
        }

        const resultado = await Conexion.query(
            `SELECT estado_operativo FROM vehiculo WHERE pk_vehiculo = $1`,
            [id]
        );

        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }

        if (resultado.rows[0].estado_operativo === 'baja') {
            return res.status(400).json({
                error: 'No se puede modificar vehículo dado de baja'
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// MIDDLEWARE: VALIDAR QUE NO ESTÉ YA EN BAJA
// ============================================
exports.validarNoEnBaja = async (req, res, next) => {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(400).json({ error: 'ID es requerido' });
        }

        const resultado = await Conexion.query(
            `SELECT estado_operativo FROM vehiculo WHERE pk_vehiculo = $1`,
            [id]
        );

        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }

        if (resultado.rows[0].estado_operativo === 'baja') {
            return res.status(400).json({
                error: 'El vehículo ya está dado de baja'
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// MIDDLEWARE: VALIDAR REGISTRO DE BAJA
// ============================================
exports.validarRegistroBaja = async (req, res, next) => {
    try {
        const { fk_vehiculo, tipo_baja, registrado_por } = req.body;

        if (fk_vehiculo === undefined || fk_vehiculo === null || fk_vehiculo === '') {
            return res.status(400).json({ error: 'fk_vehiculo es requerido' });
        }

        if (tipo_baja === undefined || tipo_baja === null || tipo_baja === '') {
            return res.status(400).json({ error: 'tipo_baja es requerido' });
        }

        if (registrado_por === undefined || registrado_por === null || registrado_por === '') {
            return res.status(400).json({ error: 'registrado_por es requerido' });
        }

        const vehiculo = await Conexion.query(
            `SELECT pk_vehiculo FROM vehiculo WHERE pk_vehiculo = $1`,
            [fk_vehiculo]
        );

        if (!vehiculo.rows.length) {
            return res.status(404).json({ error: 'El vehículo no existe' });
        }

        const estado = await Conexion.query(
            `SELECT estado_operativo FROM vehiculo WHERE pk_vehiculo = $1`,
            [fk_vehiculo]
        );

        if (estado.rows[0].estado_operativo !== 'baja') {
            return res.status(400).json({
                error: 'El vehículo debe estar en estado baja antes de registrar la baja'
            });
        }

        const bajaExistente = await Conexion.query(
            `SELECT pk_baja FROM baja_vehiculo WHERE fk_vehiculo = $1`,
            [fk_vehiculo]
        );

        if (bajaExistente.rows.length) {
            return res.status(400).json({
                error: 'El vehículo ya tiene una baja registrada'
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};