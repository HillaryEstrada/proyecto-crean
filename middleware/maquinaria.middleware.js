// ============================================
// MIDDLEWARE: maquinaria.middleware.js
// Descripción: Validaciones para maquinaria
// ============================================

const Conexion = require('../config/database');

// ============================================
// CONFIGURACIÓN DE VALIDACIONES
// ============================================
const fkValidaciones = [
    { campo: 'fk_tipo', tabla: 'tipo_equipo', pk: 'pk_tipo_equipo', mensaje: 'El tipo de equipo no existe' },
    { campo: 'fk_ubicacion', tabla: 'ubicacion', pk: 'pk_ubicacion', mensaje: 'La ubicación no existe' },
    { campo: 'fk_factura', tabla: 'factura', pk: 'pk_factura', mensaje: 'La factura no existe' },
    { campo: 'fk_garantia', tabla: 'garantia', pk: 'pk_garantia', mensaje: 'La garantía no existe' }
];

const camposUnicos = [
    { campo: 'numero_economico', mensaje: 'El número económico ya está en uso' },
    { campo: 'serie', mensaje: 'La serie ya está en uso' },
    { campo: 'numero_inventario_seder', mensaje: 'El número de inventario ya está en uso' }
];

const camposRequeridos = [
    'numero_economico',
    'fk_tipo',
    'marca',
    'modelo',
    'anio',
    'serie',
    'estado_fisico',
    'estado_operativo',
    'fk_ubicacion',
    'fk_factura',
    'foto_maquina',
    'registrado_por'
];

// ============================================
// MIDDLEWARE: VALIDAR CAMPOS REQUERIDOS
// ============================================
exports.validarCamposRequeridos = (req, res, next) => {
    for (const campo of camposRequeridos) {
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
exports.validarFKMaquinaria = async (req, res, next) => {
    try {
        for (const validacion of fkValidaciones) {
            if (req.body[validacion.campo] !== undefined && req.body[validacion.campo] !== null) {
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
exports.validarCamposUnicosMaquinaria = async (req, res, next) => {
    try {
        const id = req.params.id;

        for (const item of camposUnicos) {
            if (
                req.body[item.campo] !== undefined &&
                req.body[item.campo] !== null &&
                req.body[item.campo] !== ''
            ) {
                let query = `SELECT pk_maquinaria FROM maquinaria WHERE ${item.campo} = $1`;
                let params = [req.body[item.campo]];

                // Si es UPDATE, excluir el mismo registro
                if (id) {
                    query += ` AND pk_maquinaria != $2`;
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
            `SELECT estado_operativo FROM maquinaria WHERE pk_maquinaria = $1`,
            [id]
        );

        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Maquinaria no encontrada' });
        }

        if (resultado.rows[0].estado_operativo === 'baja') {
            return res.status(400).json({
                error: 'No se puede modificar maquinaria dada de baja'
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
            `SELECT estado_operativo FROM maquinaria WHERE pk_maquinaria = $1`,
            [id]
        );

        if (!resultado.rows.length) {
            return res.status(404).json({ error: 'Maquinaria no encontrada' });
        }

        if (resultado.rows[0].estado_operativo === 'baja') {
            return res.status(400).json({
                error: 'La maquinaria ya está dada de baja'
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
        const { fk_maquinaria, tipo_baja, registrado_por } = req.body;

        // Validar campos requeridos
        if (
            fk_maquinaria === undefined || fk_maquinaria === null || fk_maquinaria === ''
        ) {
            return res.status(400).json({ error: 'fk_maquinaria es requerido' });
        }

        if (
            tipo_baja === undefined || tipo_baja === null || tipo_baja === ''
        ) {
            return res.status(400).json({ error: 'tipo_baja es requerido' });
        }

        if (
            registrado_por === undefined || registrado_por === null || registrado_por === ''
        ) {
            return res.status(400).json({ error: 'registrado_por es requerido' });
        }

        // Validar que la maquinaria exista
        const maquinaria = await Conexion.query(
            `SELECT pk_maquinaria FROM maquinaria WHERE pk_maquinaria = $1`,
            [fk_maquinaria]
        );

        if (!maquinaria.rows.length) {
            return res.status(404).json({ error: 'La maquinaria no existe' });
        }

        // Validar que la maquinaria esté en estado "baja"
        const estado = await Conexion.query(
            `SELECT estado_operativo FROM maquinaria WHERE pk_maquinaria = $1`,
            [fk_maquinaria]
        );

        if (estado.rows[0].estado_operativo !== 'baja') {
            return res.status(400).json({
                error: 'La maquinaria debe estar en estado baja antes de registrar la baja'
            });
        }

        // Validar que NO exista ya una baja registrada
        const bajaExistente = await Conexion.query(
            `SELECT pk_baja FROM baja_maquinaria WHERE fk_maquinaria = $1`,
            [fk_maquinaria]
        );

        if (bajaExistente.rows.length) {
            return res.status(400).json({
                error: 'La maquinaria ya tiene una baja registrada'
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};