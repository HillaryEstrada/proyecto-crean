// ============================================
// MODELO: pedidos.model.js
// Descripción: Maneja las operaciones de base de datos para pedidos
// ============================================

const Conexion = require('../../config/database'); // Importa la conexión a PostgreSQL

module.exports = {
    // Crear un nuevo pedido
    crear: (data) => Conexion.query(
        'INSERT INTO pedidos(numero_pedido, fk_cliente, total, estado_pedido, observaciones) VALUES($1, $2, $3, $4, $5)',
        [data.numero_pedido, data.fk_cliente, data.total, data.estado_pedido, data.observaciones]
    ),

    // Listar todos los pedidos activos con información del cliente (JOIN)
    listar: () => Conexion.query(
        `SELECT 
            p.pk_pedido, 
            p.numero_pedido, 
            p.fk_cliente,
            c.nombre AS cliente_nombre,
            c.email AS cliente_email,
            p.fecha_pedido,
            p.total, 
            p.estado_pedido, 
            p.observaciones
        FROM pedidos p
        INNER JOIN clientes c ON p.fk_cliente = c.pk_cliente
        WHERE p.estado = 1
        ORDER BY p.pk_pedido DESC` // Los más recientes primero
    ),

    // Obtener un pedido específico por ID
    obtenerPorId: (id) => Conexion.query(
        `SELECT 
            p.*, 
            c.nombre AS cliente_nombre
        FROM pedidos p
        INNER JOIN clientes c ON p.fk_cliente = c.pk_cliente
        WHERE p.pk_pedido = $1`,
        [id]
    ),

    // Actualizar un pedido existente
    actualizar: (id, data) => Conexion.query(
        'UPDATE pedidos SET numero_pedido=$1, fk_cliente=$2, total=$3, estado_pedido=$4, observaciones=$5 WHERE pk_pedido=$6',
        [data.numero_pedido, data.fk_cliente, data.total, data.estado_pedido, data.observaciones, id]
    ),

    // Desactivar pedido (soft delete - cambiar estado a 0)
    desactivar: (id) => Conexion.query(
        'UPDATE pedidos SET estado=0 WHERE pk_pedido=$1',
        [id]
    ),

    // Eliminar pedido permanentemente (hard delete)
    desaparecer: (id) => Conexion.query(
        'DELETE FROM pedidos WHERE pk_pedido=$1',
        [id]
    )
};