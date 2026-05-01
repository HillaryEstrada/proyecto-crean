// ============================================
// MODELO: prestamo_mobiliario.model.js
// ============================================

const Conexion = require('../../config/database');

// ============================================
// Crear préstamo (dentro de transacción)
// ============================================
exports.crear = async (client, datos) => {
    const { fk_responsable, fecha_inicio, fecha_fin, motivo, registrado_por } = datos;
    return client.query(
        `INSERT INTO prestamo_mobiliario (fk_responsable, fecha_inicio, fecha_fin, motivo, registrado_por)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
            fk_responsable || null,
            fecha_inicio,
            fecha_fin      || null,
            motivo         || null,
            registrado_por || null
        ]
    );
};

// ============================================
// Agregar mueble al préstamo (dentro de transacción)
// ============================================
exports.agregarDetalle = async (client, fk_prestamo, fk_mobiliario) => {
    return client.query(
        `INSERT INTO prestamo_detalle (fk_prestamo, fk_mobiliario)
         VALUES ($1, $2)
         RETURNING *`,
        [fk_prestamo, fk_mobiliario]
    );
};

// ============================================
// Listar préstamos activos
// ============================================
exports.listarActivos = async () => {
    return Conexion.query(
        `SELECT
            pm.pk_prestamo,
            pm.fecha_inicio,
            pm.fecha_fin,
            pm.motivo,
            pm.estado,
            pm.fecha_registro,
            CONCAT(e.nombre, ' ', e.apellido_paterno) AS responsable,
            ur.username                               AS registrado_por,
            COUNT(pd.pk_detalle)                      AS total_muebles
         FROM prestamo_mobiliario pm
         LEFT JOIN empleado e  ON e.pk_empleado = pm.fk_responsable
         LEFT JOIN users    ur ON ur.pk_user    = pm.registrado_por
         LEFT JOIN prestamo_detalle pd ON pd.fk_prestamo = pm.pk_prestamo
         WHERE pm.estado = 'activo'
         GROUP BY pm.pk_prestamo, e.nombre, e.apellido_paterno, ur.username
         ORDER BY pm.fecha_registro DESC`
    );
};

// ============================================
// Listar todos los préstamos (historial)
// ============================================
exports.listarTodos = async ({ estado } = {}) => {
    let conditions = [];
    const params   = [];

    if (estado) {
        params.push(estado);
        conditions.push(`pm.estado = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    return Conexion.query(
        `SELECT
            pm.pk_prestamo,
            pm.fecha_inicio,
            pm.fecha_fin,
            pm.motivo,
            pm.estado,
            pm.fecha_registro,
            CONCAT(e.nombre, ' ', e.apellido_paterno) AS responsable,
            ur.username                               AS registrado_por,
            COUNT(pd.pk_detalle)                      AS total_muebles
         FROM prestamo_mobiliario pm
         LEFT JOIN empleado e  ON e.pk_empleado = pm.fk_responsable
         LEFT JOIN users    ur ON ur.pk_user    = pm.registrado_por
         LEFT JOIN prestamo_detalle pd ON pd.fk_prestamo = pm.pk_prestamo
         ${where}
         GROUP BY pm.pk_prestamo, e.nombre, e.apellido_paterno, ur.username
         ORDER BY pm.fecha_registro DESC`,
        params
    );
};

// ============================================
// Obtener detalle de un préstamo (qué muebles incluye)
// ============================================
exports.obtenerDetalle = async (fk_prestamo) => {
    return Conexion.query(
        `SELECT
            pd.pk_detalle,
            pd.fk_mobiliario,
            m.nombre           AS mueble,
            m.numero_economico,
            m.estado_fisico,
            u.nombre           AS ubicacion
         FROM prestamo_detalle pd
         INNER JOIN mobiliario m ON m.pk_mobiliario  = pd.fk_mobiliario
         LEFT JOIN  ubicacion  u ON u.pk_ubicacion   = m.fk_ubicacion
         WHERE pd.fk_prestamo = $1
         ORDER BY m.nombre ASC`,
        [fk_prestamo]
    );
};

// ============================================
// Obtener préstamo por ID
// ============================================
exports.obtenerPorId = async (id) => {
    return Conexion.query(
        `SELECT
            pm.*,
            CONCAT(e.nombre, ' ', e.apellido_paterno) AS responsable,
            ur.username                               AS registrado_por_nombre
         FROM prestamo_mobiliario pm
         LEFT JOIN empleado e  ON e.pk_empleado = pm.fk_responsable
         LEFT JOIN users    ur ON ur.pk_user    = pm.registrado_por
         WHERE pm.pk_prestamo = $1`,
        [id]
    );
};

// ============================================
// Cambiar estado del préstamo (dentro de transacción)
// ============================================
exports.cambiarEstado = async (client, id, estado) => {
    return client.query(
        `UPDATE prestamo_mobiliario
         SET estado = $1
         WHERE pk_prestamo = $2
         RETURNING *`,
        [estado, id]
    );
};