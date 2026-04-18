// ============================================
// MODELO: garantia.model.js
// Descripción: Consultas SQL para garantía
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // Crear garantía
    crear: (data) => Conexion.query(
        `INSERT INTO garantia
        (fecha_inicio, fecha_fin, limite_horas, limite_km, garantia_pdf, estado, registrado_por)
        VALUES($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
            data.fecha_inicio,
            data.fecha_fin || null,
            data.limite_horas || null,
            data.limite_km || null,
            data.garantia_pdf || null,
            data.estado || 1,
            data.registrado_por
        ]
    ),

    // Listar garantías activas
    listar: () => Conexion.query(
        `SELECT
            g.*,
            u.username as registrado_por_usuario
        FROM garantia g
        LEFT JOIN users u ON g.registrado_por = u.pk_user
        WHERE g.estado = 1
        ORDER BY g.fecha_registro DESC`
    ),

    // Listar todas (activas e inactivas)
    listarTodas: () => Conexion.query(
        `SELECT
            g.*,
            u.username as registrado_por_usuario
        FROM garantia g
        LEFT JOIN users u ON g.registrado_por = u.pk_user
        ORDER BY g.fecha_registro DESC`
    ),

    // Obtener por ID
    obtenerPorId: (id) => Conexion.query(
        `SELECT
            g.*,
            u.username as registrado_por_usuario
        FROM garantia g
        LEFT JOIN users u ON g.registrado_por = u.pk_user
        WHERE g.pk_garantia = $1`,
        [id]
    ),

    // Actualizar garantía
    actualizar: (id, data) => Conexion.query(
        `UPDATE garantia
        SET fecha_inicio=$1, fecha_fin=$2, limite_horas=$3, limite_km=$4, garantia_pdf=$5
        WHERE pk_garantia=$6
        RETURNING *`,
        [
            data.fecha_inicio || null,
            data.fecha_fin || null,
            data.limite_horas || null,
            data.limite_km || null,
            data.garantia_pdf || null,
            id
        ]
    ),

 // Desactivar garantía (baja lógica)
    desactivar: (id) => Conexion.query(
        `UPDATE garantia
         SET estado=0
         WHERE pk_garantia=$1
         RETURNING *`,
        [id]
    ),

    // Activar garantía
    activar: (id) => Conexion.query(
        `UPDATE garantia
         SET estado=1
         WHERE pk_garantia=$1
         RETURNING *`,
        [id]
    ),

    // Verificar si existe
    existe: (id) => Conexion.query(
        `SELECT pk_garantia FROM garantia
         WHERE pk_garantia = $1`,
        [id]
    )

};