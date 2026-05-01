const Conexion = require('../../config/database');

module.exports = {

    crear: (data) => Conexion.query(
        `INSERT INTO proveedor
        (nombre, direccion, telefono, correo, estado, registrado_por)
        VALUES($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
            data.nombre,
            data.direccion || null,
            data.telefono || null,
            data.correo || null,
            data.estado || 1,
            data.registrado_por
        ]
    ),

    listar: () => Conexion.query(
        `SELECT
            p.*,
            u.username as registrado_por_usuario
        FROM proveedor p
        LEFT JOIN users u ON p.registrado_por = u.pk_user
        WHERE p.estado = 1
        ORDER BY p.nombre ASC`
    ),

    listarTodos: () => Conexion.query(
        `SELECT
            p.*,
            u.username as registrado_por_usuario
        FROM proveedor p
        LEFT JOIN users u ON p.registrado_por = u.pk_user
        ORDER BY p.nombre ASC`
    ),

    obtenerPorId: (id) => Conexion.query(
        `SELECT
            p.*,
            u.username as registrado_por_usuario
        FROM proveedor p
        LEFT JOIN users u ON p.registrado_por = u.pk_user
        WHERE p.pk_proveedor = $1`,
        [id]
    ),

    actualizar: (id, data) => Conexion.query(
        `UPDATE proveedor
         SET nombre=$1, direccion=$2, telefono=$3, correo=$4
         WHERE pk_proveedor=$5
         RETURNING *`,
        [
            data.nombre,
            data.direccion || null,
            data.telefono || null,
            data.correo || null,
            id
        ]
    ),

    desactivar: (id) => Conexion.query(
        `UPDATE proveedor SET estado=0 WHERE pk_proveedor=$1 RETURNING *`,
        [id]
    ),

    reactivar: (id) => Conexion.query(
        `UPDATE proveedor SET estado=1 WHERE pk_proveedor=$1 RETURNING *`,
        [id]
    ),

    existe: (id) => Conexion.query(
        `SELECT pk_proveedor FROM proveedor WHERE pk_proveedor=$1`,
        [id]
    ),

    existePorNombre: (nombre, idActual = null) => Conexion.query(
        `SELECT pk_proveedor FROM proveedor
         WHERE nombre = $1 ${idActual ? `AND pk_proveedor != $2` : ''}`,
        idActual ? [nombre, idActual] : [nombre]
    ),
        verificarMaquinariaActiva: (id) => Conexion.query(
        `SELECT COUNT(*) FROM maquinaria 
        WHERE fk_factura IN (
            SELECT pk_factura FROM factura WHERE fk_proveedor = $1
        ) AND estado_operativo != 'baja'`,
        [id]
    ),

    verificarVehiculosActivos: (id) => Conexion.query(
        `SELECT COUNT(*) FROM vehiculo 
        WHERE fk_factura IN (
            SELECT pk_factura FROM factura WHERE fk_proveedor = $1
        ) AND estado_operativo != 'baja'`,
        [id]
    ),
};