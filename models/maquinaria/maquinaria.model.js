// ============================================
// MODELO: maquinaria.model.js
// Descripción: Consultas SQL para maquinaria
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // Crear maquinaria
    crear: (data) => Conexion.query(
        `INSERT INTO maquinaria 
        (numero_economico, tipo_equipo, marca, modelo, anio, ubicacion) 
        VALUES($1, $2, $3, $4, $5, $6)`,
        [
            data.numero_economico,
            data.tipo_equipo,
            data.marca,
            data.modelo,
            data.anio,
            data.ubicacion
        ]
    ),

    // Listar maquinaria activa
    listar: () => Conexion.query(
        `SELECT * FROM maquinaria 
         WHERE estado_operativo != 'baja'
         ORDER BY pk_maquinaria ASC`
    ),

    // Obtener por ID
    obtenerPorId: (id) => Conexion.query(
        `SELECT * FROM maquinaria 
         WHERE pk_maquinaria = $1`,
        [id]
    ),

    // Actualizar maquinaria
    actualizar: (id, data) => Conexion.query(
        `UPDATE maquinaria 
         SET tipo_equipo=$1, marca=$2, modelo=$3, anio=$4, ubicacion=$5 
         WHERE pk_maquinaria=$6`,
        [
            data.tipo_equipo,
            data.marca,
            data.modelo,
            data.anio,
            data.ubicacion,
            id
        ]
    ),

    // Baja lógica
    desactivar: (id) => Conexion.query(
        `UPDATE maquinaria 
         SET estado_operativo='baja' 
         WHERE pk_maquinaria=$1`,
        [id]
    ),

    // Eliminación definitiva
    desaparecer: (id) => Conexion.query(
        `DELETE FROM maquinaria 
         WHERE pk_maquinaria=$1`,
        [id]
    )
};