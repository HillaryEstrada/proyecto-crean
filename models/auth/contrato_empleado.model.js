// ============================================
// MODELO: contrato_empleado.model.js
// Descripción: Operaciones con la tabla contrato_empleado
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // Listar todos los contratos de un empleado (historial completo)
    listarPorEmpleado: (fk_empleado) => Conexion.query(
        `SELECT ce.pk_contrato, ce.fk_empleado, ce.fk_tipo_contrato,
                ce.fecha_inicio, ce.fecha_fin, ce.activo,
                tc.nombre AS tipo_contrato
         FROM contrato_empleado ce
         INNER JOIN tipo_contrato tc ON tc.pk_tipo_contrato = ce.fk_tipo_contrato
         WHERE ce.fk_empleado = $1
         ORDER BY ce.fecha_inicio DESC`,
        [fk_empleado]
    ),

    // Obtener contrato activo de un empleado
    obtenerActivo: (fk_empleado) => Conexion.query(
        `SELECT ce.pk_contrato, ce.fk_empleado, ce.fk_tipo_contrato,
                ce.fecha_inicio, ce.fecha_fin, ce.activo,
                tc.nombre AS tipo_contrato
         FROM contrato_empleado ce
         INNER JOIN tipo_contrato tc ON tc.pk_tipo_contrato = ce.fk_tipo_contrato
         WHERE ce.fk_empleado = $1 AND ce.activo = true
         LIMIT 1`,
        [fk_empleado]
    ),

    // Crear nuevo contrato (fecha_fin = fecha_inicio + 6 meses)
    crear: (fk_empleado, fk_tipo_contrato, fecha_inicio) => Conexion.query(
        `INSERT INTO contrato_empleado (fk_empleado, fk_tipo_contrato, fecha_inicio, fecha_fin, activo)
         VALUES ($1, $2, $3, ($3::DATE + INTERVAL '6 months')::DATE, true)
         RETURNING pk_contrato, fecha_inicio, fecha_fin`,
        [fk_empleado, fk_tipo_contrato, fecha_inicio]
    ),

    // Desactivar contrato activo de un empleado (al dar de baja)
    desactivarContrato: (fk_empleado) => Conexion.query(
        `UPDATE contrato_empleado
         SET activo = false
         WHERE fk_empleado = $1 AND activo = true`,
        [fk_empleado]
    ),

    // Verificar si ya existe un contrato activo para el empleado
    tieneContratoActivo: (fk_empleado) => Conexion.query(
        `SELECT pk_contrato FROM contrato_empleado
         WHERE fk_empleado = $1 AND activo = true LIMIT 1`,
        [fk_empleado]
    ),
};