
const Conexion = require('../../config/database'); // Importa la conexión a PostgreSQL

module.exports = {
    // Crear un nuevo cliente
    crear: (data) => Conexion.query(
        'INSERT INTO computadora(nombre, marca, precio) VALUES($1, $2, $3)',
        [data.nombre, data.marca, data.precio,]
    ),

    // Listar todos los computadora activos (estado = 1)
    listar: () => Conexion.query(
        'SELECT * FROM computadora WHERE estado = 1 ORDER BY id ASC'
    ),

    // Obtener un cliente por su ID (necesario para el select en pedidos)
    obtenerPorId: (id) => Conexion.query(
        'SELECT * FROM computadora WHERE id = $1 AND estado = 1',
        [id]
    ),

    // Actualizar datos de un cliente
    actualizar: (id, data) => Conexion.query(
        'UPDATE computadora SET nombre=$1, marca=$2, precio=$3 WHERE id=$4',
        [data.nombre, data.marca, data.precio, id]
    ),

    // Desactivar cliente (soft delete - cambiar estado a 0)
    desactivar: (id) => Conexion.query(
        'UPDATE computadora SET estado=0 WHERE id=$1',
        [id]
    ),

    // Eliminar cliente permanentemente (hard delete)
    // NOTA: Fallará si tiene pedidos asociados por la FK RESTRICT
    desaparecer: (id) => Conexion.query(
        'DELETE FROM computadora WHERE id=$1',
        [id]
    )
};