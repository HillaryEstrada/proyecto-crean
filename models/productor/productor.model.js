// ============================================
// MODELO: productor.model.js
// Descripción: Consultas SQL para productor
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Crear productor
    // ============================================
        crear: (data) => Conexion.query(
        `INSERT INTO productor
        (nombre, curp, telefono, observaciones, fk_ejido, fk_predio, registrado_por)
        VALUES($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
            data.nombre,
            data.curp,
            data.telefono      || null,
            data.observaciones || null,
            data.fk_ejido      || null,
            data.fk_predio     || null,
            data.registrado_por
        ]
    ),

    // ============================================
    // Listar productores activos (estado = 1)
    // ============================================
        listar: () => Conexion.query(
        `SELECT
            p.*,
            usr.username AS registrado_por_usuario,
            e.nombre     AS ejido_nombre,
            pr.nombre    AS predio_nombre
        FROM productor p
        LEFT JOIN users  usr ON p.registrado_por = usr.pk_user
        LEFT JOIN ejido  e   ON p.fk_ejido       = e.pk_ejido
        LEFT JOIN predio pr  ON p.fk_predio      = pr.pk_predio
        WHERE p.estado = 1
        ORDER BY p.pk_productor ASC`
    ),

    // ============================================
    // Listar productores inactivos (estado = 0)
    // ============================================
    listarInactivos: () => Conexion.query(
        `SELECT
            p.*,
            usr.username AS registrado_por_usuario,
            e.nombre     AS ejido_nombre,
            pr.nombre    AS predio_nombre
        FROM productor p
        LEFT JOIN users  usr ON p.registrado_por = usr.pk_user
        LEFT JOIN ejido  e   ON p.fk_ejido       = e.pk_ejido
        LEFT JOIN predio pr  ON p.fk_predio      = pr.pk_predio
        WHERE p.estado = 0
        ORDER BY p.pk_productor ASC`
    ),

    // ============================================
    // Obtener por ID
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            p.*,
            usr.username AS registrado_por_usuario,
            e.nombre     AS ejido_nombre,
            pr.nombre    AS predio_nombre
        FROM productor p
        LEFT JOIN users  usr ON p.registrado_por = usr.pk_user
        LEFT JOIN ejido  e   ON p.fk_ejido       = e.pk_ejido
        LEFT JOIN predio pr  ON p.fk_predio      = pr.pk_predio
        WHERE p.pk_productor = $1`,
        [id]
    ),

    // ============================================
    // Actualizar productor
    // ============================================
        actualizar: (id, data) => Conexion.query(
        `UPDATE productor
        SET
            nombre        = COALESCE($1, nombre),
            curp          = COALESCE($2, curp),
            telefono      = $3,
            observaciones = $4,
            fk_ejido      = $5,
            fk_predio     = $6
        WHERE pk_productor = $7
        RETURNING *`,
        [
            data.nombre,
            data.curp      || null,
            data.telefono  || null,
            data.observaciones || null,
            data.fk_ejido  || null,
            data.fk_predio || null,
            id
        ]
    ),

    // ============================================
    // Desactivar — baja lógica (estado = 0)
    // ============================================
    desactivar: (id) => Conexion.query(
        `UPDATE productor
         SET estado = 0
         WHERE pk_productor = $1
         RETURNING *`,
        [id]
    ),

    // ============================================
    // Reactivar (estado = 1)
    // ============================================
    reactivar: (id) => Conexion.query(
        `UPDATE productor
         SET estado = 1
         WHERE pk_productor = $1
         RETURNING *`,
        [id]
    ),

    // ============================================
    // Verificar si el nombre ya existe
    // ============================================
    existeNombre: (nombre, idActual = null) => Conexion.query(
        `SELECT pk_productor FROM productor
         WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1))
         ${idActual ? 'AND pk_productor != $2' : ''}`,
        idActual ? [nombre, idActual] : [nombre]
    ),

    // ============================================
    // Verificar si la CURP ya existe
    // ============================================
    existeCurp: (curp, idActual = null) => Conexion.query(
        `SELECT pk_productor FROM productor
         WHERE UPPER(TRIM(curp)) = UPPER(TRIM($1))
         ${idActual ? 'AND pk_productor != $2' : ''}`,
        idActual ? [curp, idActual] : [curp]
    )

};