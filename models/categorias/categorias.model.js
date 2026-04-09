
const Conexion = require('../../config/database'); // Importa la conexión a PostgreSQL

module.exports = {
    // Crear un nuevo cliente
    crear: (data) => Conexion.query(
        'INSERT INTO categoria(nombre, descripcion) VALUES($1, $2)',
        [data.nombre, data.descripcion]
    ),

    // Listar todos los categoria activos (estado = 1)
    listar: () => Conexion.query(
        'SELECT * FROM categoria WHERE estado = 1 ORDER BY pk_categoria ASC'
    ),

    // Obtener un cliente por su ID (necesario para el select en pedidos)
    obtenerPorId: (id) => Conexion.query(
        'SELECT * FROM categoria WHERE pk_categoria = $1 AND estado = 1',
        [id]
    ),

    // Actualizar datos de un cliente
    actualizar: (id, data) => Conexion.query(
        'UPDATE categoria SET nombre=$1, descripcion=$2 WHERE pk_categoria=$3',
        [data.nombre, data.descripcion, id]
    ),

    // Desactivar cliente (soft delete - cambiar estado a 0)
    desactivar: (id) => Conexion.query(
        'UPDATE categoria SET estado=0 WHERE pk_categoria=$1',
        [id]
    ),

    // Eliminar cliente permanentemente (hard delete)
    // NOTA: Fallará si tiene pedidos asociados por la FK RESTRICT
    desaparecer: (id) => Conexion.query(
        'DELETE FROM categoria WHERE pk_categoria=$1',
        [id]
    )
};