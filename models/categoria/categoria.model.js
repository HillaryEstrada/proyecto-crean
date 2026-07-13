// ============================================
// MODELO: categoria.model.js
// Descripción: Consultas SQL para categorías de consumibles
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Crear categoría
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO categoria
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
    // Listar categorías activas (estado = 1)
    // ============================================
    listar: () => Conexion.query(
        `SELECT
            c.*,
            u.username AS registrado_por_usuario
        FROM categoria c
        LEFT JOIN users u ON c.registrado_por = u.pk_user
        WHERE c.estado = 1
        ORDER BY c.clave ASC`
    ),

    // ============================================
    // Listar todas las categorías (activas e inactivas)
    // ============================================
    listarTodos: () => Conexion.query(
        `SELECT
            c.*,
            u.username AS registrado_por_usuario
        FROM categoria c
        LEFT JOIN users u ON c.registrado_por = u.pk_user
        ORDER BY c.clave ASC`
    ),

    // ============================================
    // Listar categorías inactivas (estado = 0)
    // ============================================
    listarInactivos: () => Conexion.query(
        `SELECT
            c.*,
            u.username AS registrado_por_usuario
        FROM categoria c
        LEFT JOIN users u ON c.registrado_por = u.pk_user
        WHERE c.estado = 0
        ORDER BY c.clave ASC`
    ),

    // ============================================
    // Obtener categoría por pk_categoria
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            c.*,
            u.username AS registrado_por_usuario
        FROM categoria c
        LEFT JOIN users u ON c.registrado_por = u.pk_user
        WHERE c.pk_categoria = $1`,
        [id]
    ),

    // ============================================
    // Actualizar categoría
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE categoria
        SET
            clave  = COALESCE($1, clave),
            nombre = COALESCE($2, nombre)
        WHERE pk_categoria = $3
        RETURNING *`,
        [
            data.clave,
            data.nombre,
            id
        ]
    ),

    // ============================================
    // Desactivar categoría (baja lógica, estado = 0)
    // ============================================
    desactivar: (id) => Conexion.query(
        `UPDATE categoria SET estado = 0 WHERE pk_categoria = $1 RETURNING *`,
        [id]
    ),

    // ============================================
    // Reactivar categoría (estado = 1)
    // ============================================
    reactivar: (id) => Conexion.query(
        `UPDATE categoria SET estado = 1 WHERE pk_categoria = $1 RETURNING *`,
        [id]
    ),

    // ============================================
    // Verificar si la clave ya existe (excluye la categoría actual si se pasa id)
    // ============================================
    existeClave: (clave, idActual = null) => Conexion.query(
        `SELECT pk_categoria FROM categoria
         WHERE clave = $1 ${idActual ? `AND pk_categoria != $2` : ''}`,
        idActual ? [clave, idActual] : [clave]
    ),

    // ============================================
    // Verificar si el nombre ya existe (evitar duplicados)
    // ============================================
    existeNombre: (nombre, idActual = null) => Conexion.query(
        `SELECT pk_categoria FROM categoria
         WHERE LOWER(nombre) = LOWER($1) ${idActual ? `AND pk_categoria != $2` : ''}`,
        idActual ? [nombre, idActual] : [nombre]
    ),

    // ============================================
    // Verificar si la categoría está en uso por algún artículo
    // ============================================
    estaEnUso: (id) => Conexion.query(
        `SELECT COUNT(*) AS total FROM inventario_articulo WHERE fk_categoria = $1`,
        [id]
    ),

};