// ============================================
// MODELO: vehiculo.model.js
// Descripción: Consultas SQL para vehiculo
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // Crear vehiculo
    crear: (data) => Conexion.query(
        `INSERT INTO vehiculo 
        (numero_economico, tipo_vehiculo, marca, modelo, anio, ubicacion) 
        VALUES($1, $2, $3, $4, $5, $6)`,
        [
            data.numero_economico,
            data.tipo_vehiculo,
            data.marca,
            data.modelo,
            data.anio,
            data.ubicacion
        ]
    ),

    // Listar vehiculo activo
    listar: () => Conexion.query(
        `SELECT * FROM vehiculo 
         WHERE estado_operativo != 'baja'
         ORDER BY pk_vehiculo ASC`
    ),

    // Obtener por ID
    obtenerPorId: (id) => Conexion.query(
        `SELECT * FROM vehiculo 
         WHERE pk_vehiculo = $1`,
        [id]
    ),

    // Actualizar vehiculo
    actualizar: (id, data) => Conexion.query(
        `UPDATE vehiculo 
         SET tipo_vehiculo=$1, marca=$2, modelo=$3, anio=$4, ubicacion=$5 
         WHERE pk_vehiculo=$6`,
        [
            data.tipo_vehiculo,
            data.marca,
            data.modelo,
            data.anio,
            data.ubicacion,
            id
        ]
    ),

    // Baja lógica
    desactivar: (id) => Conexion.query(
        `UPDATE vehiculo 
         SET estado_operativo='baja' 
         WHERE pk_vehiculo=$1`,
        [id]
    ),

    // Eliminación definitiva
    desaparecer: (id) => Conexion.query(
        `DELETE FROM vehiculo 
         WHERE pk_vehiculo=$1`,
        [id]
    )
};