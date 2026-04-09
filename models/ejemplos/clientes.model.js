// ============================================
// MODELO: clientes.model.js
// Descripción: Maneja las operaciones de base de datos para clientes
// ============================================

const Conexion = require('../../config/database'); // Importa la conexión a PostgreSQL

module.exports = {
    // Crear un nuevo cliente
    crear: (data) => Conexion.query(
        'INSERT INTO clientes2(nombre, email, telefono, direccion) VALUES($1, $2, $3, $4)',
        [data.nombre, data.email, data.telefono, data.direccion]
    ),

    // Listar todos los clientes2 activos (estado = 1)
    listar: () => Conexion.query(
        'SELECT * FROM clientes2 WHERE estado = 1 ORDER BY pk_cliente ASC'
    ),

    // Obtener un cliente por su ID (necesario para el select en pedidos)
    obtenerPorId: (id) => Conexion.query(
        'SELECT * FROM clientes2 WHERE pk_cliente = $1 AND estado = 1',
        [id]
    ),

    // Actualizar datos de un cliente
    actualizar: (id, data) => Conexion.query(
        'UPDATE clientes2 SET nombre=$1, email=$2, telefono=$3, direccion=$4 WHERE pk_cliente=$5',
        [data.nombre, data.email, data.telefono, data.direccion, id]
    ),

    // Desactivar cliente (soft delete - cambiar estado a 0)
    desactivar: (id) => Conexion.query(
        'UPDATE clientes2 SET estado=0 WHERE pk_cliente=$1',
        [id]
    ),

    // Eliminar cliente permanentemente (hard delete)
    // NOTA: Fallará si tiene pedidos asociados por la FK RESTRICT
    desaparecer: (id) => Conexion.query(
        'DELETE FROM clientes2 WHERE pk_cliente=$1',
        [id]
    )
};