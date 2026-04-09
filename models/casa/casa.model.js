
const Conexion = require('../../config/database'); // Importa la conexión a PostgreSQL

module.exports = {
    // Crear un nuevo cliente
    crear: (data) => Conexion.query(
        'INSERT INTO casa(nombre, ubicacion, persona, mascota) VALUES($1, $2, $3, $4)',
        [data.nombre, data.ubicacion, data.persona, data.mascota]
    ),

    // Listar todos los categoria activos (estado = 1)
    listar: () => Conexion.query(
        'SELECT * FROM casa WHERE estado = 1 ORDER BY pk_casa ASC'
    ),

    // Obtener un cliente por su ID (necesario para el select en pedidos)
    obtenerPorId: (id) => Conexion.query(
        'SELECT * FROM casa WHERE pk_casa = $1 AND estado = 1',
        [id]
    ),

    // Actualizar datos de un cliente
    actualizar: (id, data) => Conexion.query(
        'UPDATE casa SET nombre=$1, ubicacion=$2, persona=$3, mascota=$4 WHERE pk_categoria=$5',
        [data.nombre, data.ubicacion, data.persona,  data.mascota, id]
    ),

    // Desactivar cliente (soft delete - cambiar estado a 0)
    desactivar: (id) => Conexion.query(
        'UPDATE casa SET estado=0 WHERE pk_casa=$1',
        [id]
    ),

    // Eliminar cliente permanentemente (hard delete)
    // NOTA: Fallará si tiene pedidos asociados por la FK RESTRICT
    desaparecer: (id) => Conexion.query(
        'DELETE FROM casa WHERE pk_casa=$1',
        [id]
    )
};