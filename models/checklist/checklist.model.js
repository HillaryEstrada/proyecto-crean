// ============================================
// MODELO: checklist.model.js
// Descripción: Consultas SQL para checklist diario
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // Crear checklist con validación
    crear: async (data) => {

        // 🔴 VALIDAR SI YA EXISTE CHECKLIST ESE DÍA
        const existe = await Conexion.query(
            `SELECT 1 
             FROM checklist_diario
             WHERE fk_maquinaria = $1 AND fecha = $2`,
            [data.fk_maquinaria, data.fecha]
        );

        if (existe.rows.length > 0) {
            throw new Error('Ya existe un checklist para esta maquinaria en esa fecha');
        }

        // 🟢 INSERTAR SI NO EXISTE
        return Conexion.query(
            `INSERT INTO checklist_diario (
                tipo_activo,
                fk_maquinaria,
                fk_vehiculo,
                fecha,
                nivel_aceite,
                nivel_refrigerante,
                filtro_aire,
                presion_llantas,
                nivel_combustible,
                engrase_puntos,
                inspeccion_visual,
                observaciones,
                realizado_por
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
            [
                data.tipo_activo,
                data.fk_maquinaria || null,
                data.fk_vehiculo || null,
                data.fecha,
                data.nivel_aceite || false,
                data.nivel_refrigerante || false,
                data.filtro_aire || false,
                data.presion_llantas || false,
                data.nivel_combustible || false,
                data.engrase_puntos || false,
                data.inspeccion_visual || false,
                data.observaciones,
                data.realizado_por
            ]
        );
    },

    // Listar todos los checklist (con operador)
    listar: () => Conexion.query(
        `SELECT c.*, m.numero_economico,
                u.username AS realizado_por_nombre
         FROM checklist_diario c
         LEFT JOIN maquinaria m ON c.fk_maquinaria = m.pk_maquinaria
         LEFT JOIN users u ON c.realizado_por = u.pk_user
         ORDER BY c.fecha DESC`
    ),

    // Obtener checklist por ID
    obtenerPorId: (id) => Conexion.query(
        `SELECT * FROM checklist_diario
         WHERE pk_checklist = $1`,
        [id]
    ),

    // Obtener checklist por maquinaria
obtenerPorMaquinaria: (id) => Conexion.query(
    `SELECT *
     FROM checklist_diario
     WHERE fk_maquinaria = $1
     ORDER BY fecha DESC`,
    [id]
),

    // Actualizar checklist
    actualizar: (id, data) => Conexion.query(
        `UPDATE checklist_diario SET
            nivel_aceite = $1,
            nivel_refrigerante = $2,
            filtro_aire = $3,
            presion_llantas = $4,
            nivel_combustible = $5,
            engrase_puntos = $6,
            inspeccion_visual = $7,
            observaciones = $8
        WHERE pk_checklist = $9`,
        [
            data.nivel_aceite,
            data.nivel_refrigerante,
            data.filtro_aire,
            data.presion_llantas,
            data.nivel_combustible,
            data.engrase_puntos,
            data.inspeccion_visual,
            data.observaciones,
            id
        ]
    ),

    // Eliminar checklist
    eliminar: (id) => Conexion.query(
        `DELETE FROM checklist_diario
         WHERE pk_checklist = $1`,
        [id]
    ),

    // Obtener checklist por maquinaria (para expediente)
    obtenerPorMaquinaria: (id) => Conexion.query(
        `SELECT *
         FROM checklist_diario
         WHERE fk_maquinaria = $1
         ORDER BY fecha DESC`,
        [id]
    )

};