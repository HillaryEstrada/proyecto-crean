const Conexion = require('../../config/database');


module.exports = {
crear: (data) => Conexion.query(
'INSERT INTO productos(nombre, precio) VALUES($1,$2)',
[data.nombre, data.precio]
),


listar: () => Conexion.query(
'SELECT * FROM productos WHERE estado = 1 Order by id ASC'
),


actualizar: (id, data) => Conexion.query(
'UPDATE productos SET nombre=$1, precio=$2 WHERE id=$3',
[data.nombre, data.precio, id]
),


desactivar: (id) => Conexion.query(
'UPDATE productos SET estado=0 WHERE id=$1',
[id]
),


desaparecer: (id) => Conexion.query(
'DELETE FROM productos where id=$1',
[id]
)
};