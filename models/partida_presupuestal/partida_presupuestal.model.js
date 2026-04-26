// ============================================
// MODELO: partida_presupuestal.model.js
// Descripción: Consultas SQL para partida presupuestal
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Crear partida presupuestal
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO partida_presupuestal
        (clave, nombre, registrado_por)
        VALUES($1, $2, $3)
        RETURNING *`,
        [
            data.clave,
            data.nombre,
            data.registrado_por
        ]
    ),

    // ============================================
    // Listar partidas activas (estado = 1)
    // ============================================
    listar: () => Conexion.query(
        `SELECT
            pp.*,
            u.username AS registrado_por_usuario
        FROM partida_presupuestal pp
        LEFT JOIN users u ON pp.registrado_por = u.pk_user
        WHERE pp.estado = 1
        ORDER BY pp.clave ASC`
    ),

    // ============================================
    // Listar todas las partidas (activas e inactivas)
    // ============================================
    listarTodos: () => Conexion.query(
        `SELECT
            pp.*,
            u.username AS registrado_por_usuario
        FROM partida_presupuestal pp
        LEFT JOIN users u ON pp.registrado_por = u.pk_user
        ORDER BY pp.clave ASC`
    ),

    // ============================================
    // Listar partidas inactivas (estado = 0)
    // ============================================
    listarInactivos: () => Conexion.query(
        `SELECT
            pp.*,
            u.username AS registrado_por_usuario
        FROM partida_presupuestal pp
        LEFT JOIN users u ON pp.registrado_por = u.pk_user
        WHERE pp.estado = 0
        ORDER BY pp.clave ASC`
    ),

    // ============================================
    // Obtener partida por clave (PK)
    // ============================================
    obtenerPorId: (clave) => Conexion.query(
        `SELECT
            pp.*,
            u.username AS registrado_por_usuario
        FROM partida_presupuestal pp
        LEFT JOIN users u ON pp.registrado_por = u.pk_user
        WHERE pp.clave = $1`,
        [clave]
    ),

    // ============================================
    // Actualizar partida presupuestal
    // ============================================
    actualizar: (clave, data) => Conexion.query(
        `UPDATE partida_presupuestal
        SET
            clave  = COALESCE($1, clave),
            nombre = COALESCE($2, nombre)
        WHERE clave = $3
        RETURNING *`,
        [
            data.clave,
            data.nombre,
            clave
        ]
    ),

    // ============================================
    // Desactivar partida (baja lógica, estado = 0)
    // ============================================
    desactivar: (clave) => Conexion.query(
        `UPDATE partida_presupuestal SET estado = 0 WHERE clave = $1 RETURNING *`,
        [clave]
    ),

    // ============================================
    // Reactivar partida (estado = 1)
    // ============================================
    reactivar: (clave) => Conexion.query(
        `UPDATE partida_presupuestal SET estado = 1 WHERE clave = $1 RETURNING *`,
        [clave]
    ),

    // ============================================
    // Verificar si la clave ya existe
    // ============================================
    existeClave: (clave) => Conexion.query(
        `SELECT clave FROM partida_presupuestal WHERE clave = $1`,
        [clave]
    ),

    // ============================================
    // Verificar si el nombre ya existe (evitar duplicados)
    // ============================================
    existeNombre: (nombre, claveActual = null) => Conexion.query(
        `SELECT clave FROM partida_presupuestal
         WHERE LOWER(nombre) = LOWER($1) ${claveActual ? `AND clave != $2` : ''}`,
        claveActual ? [nombre, claveActual] : [nombre]
    )

};