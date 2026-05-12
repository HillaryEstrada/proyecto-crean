// ============================================
// MODELO: contrato_empleado.model.js
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    listarPorEmpleado: (fk_empleado) => Conexion.query(
        `SELECT ce.pk_contrato, ce.fk_empleado, ce.fk_tipo_contrato,
            ce.fecha_inicio, ce.fecha_fin, ce.activo,
            ce.numero_contrato, ce.justificacion, ce.documento_contrato, 
            ce.regimen_laboral, ce.tipo_alta, ce.estado_contrato,
            ce.fecha_registro, ce.registrado_por,
            u.username AS registrado_por_username,
            tc.nombre AS tipo_contrato
        FROM contrato_empleado ce
        INNER JOIN tipo_contrato tc ON tc.pk_tipo_contrato = ce.fk_tipo_contrato
        LEFT JOIN users u ON u.pk_user = ce.registrado_por
        WHERE ce.fk_empleado = $1
        ORDER BY ce.fecha_inicio DESC`,
        [fk_empleado]
    ),

    obtenerActivo: (fk_empleado) => Conexion.query(
        `SELECT ce.pk_contrato, ce.fk_empleado, ce.fk_tipo_contrato,
            ce.fecha_inicio, ce.fecha_fin, ce.activo,
            ce.numero_contrato, ce.justificacion, ce.documento_contrato, 
            ce.regimen_laboral, ce.tipo_alta, ce.estado_contrato,
            ce.fecha_registro, ce.registrado_por,
            u.username AS registrado_por_username,
            tc.nombre AS tipo_contrato
        FROM contrato_empleado ce
        INNER JOIN tipo_contrato tc ON tc.pk_tipo_contrato = ce.fk_tipo_contrato
        LEFT JOIN users u ON u.pk_user = ce.registrado_por
        WHERE ce.fk_empleado = $1 AND ce.activo = true
        LIMIT 1`,
        [fk_empleado]
    ),

    crear: (fk_empleado, fk_tipo_contrato, fecha_inicio, numero_contrato = null, justificacion = null, documento_contrato = null, regimen_laboral = null, tipo_alta = null, fecha_fin = null, registrado_por = null) => Conexion.query(
        `INSERT INTO contrato_empleado 
            (fk_empleado, fk_tipo_contrato, fecha_inicio, fecha_fin, activo,
            numero_contrato, justificacion, documento_contrato, regimen_laboral, tipo_alta, estado_contrato, registrado_por)
        VALUES ($1, $2, $3, COALESCE($9::DATE, ($3::DATE + INTERVAL '6 months')::DATE), true, $4, $5, $6, $7, $8, 'vigente', $10)
        RETURNING pk_contrato, fecha_inicio, fecha_fin`,
        [fk_empleado, fk_tipo_contrato, fecha_inicio, numero_contrato, justificacion, documento_contrato, regimen_laboral, tipo_alta, fecha_fin, registrado_por]
    ),

    desactivarContrato: (fk_empleado) => Conexion.query(
        `UPDATE contrato_empleado
        SET activo = false,
            fecha_fin = COALESCE(fecha_fin, CURRENT_DATE),
            estado_contrato = 'cancelado'
        WHERE fk_empleado = $1 AND activo = true`,
        [fk_empleado]
    ),

    tieneContratoActivo: (fk_empleado) => Conexion.query(
        `SELECT pk_contrato FROM contrato_empleado
         WHERE fk_empleado = $1 AND activo = true LIMIT 1`,
        [fk_empleado]
    ),

    existeNumeroContrato: (numero_contrato, excludeId = null) => {
        const query = excludeId
            ? 'SELECT pk_contrato FROM contrato_empleado WHERE numero_contrato=$1 AND pk_contrato != $2'
            : 'SELECT pk_contrato FROM contrato_empleado WHERE numero_contrato=$1';
        const params = excludeId ? [numero_contrato, excludeId] : [numero_contrato];
        return Conexion.query(query, params);
    },
};