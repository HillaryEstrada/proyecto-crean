// ============================================
// MODELO: mobiliario.model.js
// Descripción: Consultas SQL para mobiliario
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Crear mueble
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO mobiliario (
            numero_economico, nombre, descripcion,
            marca, modelo, numero_serie,
            estado_fisico, fk_ubicacion, fk_responsable, registrado_por
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
            data.numero_economico,
            data.nombre,
            data.descripcion    || null,
            data.marca          || null,
            data.modelo         || null,
            data.numero_serie   || null,
            data.estado_fisico  || 'bueno',
            data.fk_ubicacion   || null,
            data.fk_responsable || null,
            data.registrado_por || null
        ]
    ),

    // ============================================
    // Listar muebles activos (disponibles / prestados / mantenimiento)
    // ============================================
    listar: ({ nombre, estado_operativo, estado_fisico } = {}) => {
        let conditions = [`m.estado_operativo != 'baja'`];
        const params   = [];

        if (nombre) {
            params.push(`%${nombre}%`);
            conditions.push(`m.nombre ILIKE $${params.length}`);
        }
        if (estado_operativo) {
            params.push(estado_operativo);
            conditions.push(`m.estado_operativo = $${params.length}`);
        }
        if (estado_fisico) {
            params.push(estado_fisico);
            conditions.push(`m.estado_fisico = $${params.length}`);
        }

        return Conexion.query(
            `SELECT
                m.pk_mobiliario,
                m.numero_economico,
                m.nombre,
                m.descripcion,
                m.marca,
                m.modelo,
                m.numero_serie,
                m.estado_fisico,
                m.estado_operativo,
                m.fk_ubicacion,
                m.fk_responsable,
                m.fecha_registro,
                u.nombre                                    AS ubicacion,
                CONCAT(e.nombre, ' ', e.apellido_paterno)   AS responsable,
                ur.username                                  AS registrado_por
             FROM mobiliario m
             LEFT JOIN ubicacion u  ON u.pk_ubicacion = m.fk_ubicacion
             LEFT JOIN empleado  e  ON e.pk_empleado  = m.fk_responsable
             LEFT JOIN users     ur ON ur.pk_user     = m.registrado_por
             WHERE ${conditions.join(' AND ')}
             ORDER BY m.nombre ASC`,
            params
        );
    },

    // ============================================
    // Listar dados de baja
    // ============================================
    listarBajas: () => Conexion.query(
        `SELECT
            m.pk_mobiliario,
            m.numero_economico,
            m.nombre,
            m.descripcion,
            m.marca,
            m.estado_fisico,
            m.estado_operativo,
            m.fecha_registro,
            u.nombre                                    AS ubicacion,
            CONCAT(e.nombre, ' ', e.apellido_paterno)   AS responsable
         FROM mobiliario m
         LEFT JOIN ubicacion u ON u.pk_ubicacion = m.fk_ubicacion
         LEFT JOIN empleado  e ON e.pk_empleado  = m.fk_responsable
         WHERE m.estado_operativo = 'baja'
         ORDER BY m.nombre ASC`
    ),

    // ============================================
    // Obtener por ID
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            m.*,
            u.nombre                                    AS ubicacion,
            CONCAT(e.nombre, ' ', e.apellido_paterno)   AS responsable,
            ur.username                                  AS registrado_por_nombre
         FROM mobiliario m
         LEFT JOIN ubicacion u  ON u.pk_ubicacion = m.fk_ubicacion
         LEFT JOIN empleado  e  ON e.pk_empleado  = m.fk_responsable
         LEFT JOIN users     ur ON ur.pk_user     = m.registrado_por
         WHERE m.pk_mobiliario = $1`,
        [id]
    ),

    // ============================================
    // Verificar número económico duplicado
    // ============================================
    existeNumeroEconomico: (numero_economico, idActual = null) => Conexion.query(
        `SELECT pk_mobiliario FROM mobiliario
         WHERE LOWER(numero_economico) = LOWER($1)
         ${idActual ? `AND pk_mobiliario != $2` : ''}`,
        idActual ? [numero_economico, idActual] : [numero_economico]
    ),

    // ============================================
    // Actualizar mueble (datos generales)
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE mobiliario SET
            nombre           = COALESCE($1, nombre),
            descripcion      = $2,
            marca            = $3,
            modelo           = $4,
            numero_serie     = $5,
            estado_fisico    = COALESCE($6, estado_fisico),
            fk_ubicacion     = $7,
            fk_responsable   = $8
         WHERE pk_mobiliario = $9
         RETURNING *`,
        [
            data.nombre,
            data.descripcion    || null,
            data.marca          || null,
            data.modelo         || null,
            data.numero_serie   || null,
            data.estado_fisico,
            data.fk_ubicacion   || null,
            data.fk_responsable || null,
            id
        ]
    ),

    // ============================================
    // Cambiar estado operativo (disponible / mantenimiento / baja)
    // ============================================
    cambiarEstadoOperativo: (client, id, estado, registrado_por) => client.query(
        `UPDATE mobiliario
         SET estado_operativo = $1, registrado_por = $2
         WHERE pk_mobiliario  = $3
         RETURNING *`,
        [estado, registrado_por, id]
    ),

    // ============================================
    // Listar disponibles (para préstamo)
    // ============================================
    listarDisponibles: () => Conexion.query(
        `SELECT
            m.pk_mobiliario,
            m.numero_economico,
            m.nombre,
            m.estado_fisico,
            u.nombre AS ubicacion,
            CONCAT(e.nombre, ' ', e.apellido_paterno) AS responsable
         FROM mobiliario m
         LEFT JOIN ubicacion u ON u.pk_ubicacion = m.fk_ubicacion
         LEFT JOIN empleado  e ON e.pk_empleado  = m.fk_responsable
         WHERE m.estado_operativo = 'disponible'
         ORDER BY m.nombre ASC`
    )
};