// ============================================
// MODELO: movimiento_mobiliario.model.js
// ============================================

const Conexion = require('../../config/database');

// ============================================
// Historial por mueble
// ============================================
exports.historialPorMobiliario = async (fk_mobiliario) => {
    return Conexion.query(
        `SELECT
            mm.pk_movimiento,
            mm.tipo_movimiento,
            mm.motivo,
            mm.fecha,
            CONCAT(ea.nombre, ' ', ea.apellido_paterno)  AS responsable_anterior,
            CONCAT(en.nombre, ' ', en.apellido_paterno)  AS responsable_nuevo,
            ua.nombre                                    AS ubicacion_anterior,
            un.nombre                                    AS ubicacion_nueva,
            ur.username                                  AS registrado_por
         FROM mobiliario_movimiento mm
         LEFT JOIN empleado   ea  ON ea.pk_empleado   = mm.fk_responsable_anterior
         LEFT JOIN empleado   en  ON en.pk_empleado   = mm.fk_responsable_nuevo
         LEFT JOIN ubicacion  ua  ON ua.pk_ubicacion  = mm.fk_ubicacion_anterior
         LEFT JOIN ubicacion  un  ON un.pk_ubicacion  = mm.fk_ubicacion_nueva
         LEFT JOIN users      ur  ON ur.pk_user       = mm.registrado_por
         WHERE mm.fk_mobiliario = $1
         ORDER BY mm.fecha DESC`,
        [fk_mobiliario]
    );
};

// ============================================
// Historial general con filtros
// ============================================
exports.historialGeneral = async ({ tipo, fecha_inicio, fecha_fin } = {}) => {
    let conditions = [];
    const params   = [];

    if (tipo) {
        params.push(tipo);
        conditions.push(`mm.tipo_movimiento = $${params.length}`);
    }
    if (fecha_inicio) {
        params.push(fecha_inicio);
        conditions.push(`mm.fecha >= $${params.length}`);
    }
    if (fecha_fin) {
        params.push(fecha_fin);
        conditions.push(`mm.fecha <= $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    return Conexion.query(
        `SELECT
            mm.pk_movimiento,
            mm.tipo_movimiento,
            mm.motivo,
            mm.fecha,
            mob.nombre                                   AS mueble,
            mob.numero_economico,
            CONCAT(ea.nombre, ' ', ea.apellido_paterno)  AS responsable_anterior,
            CONCAT(en.nombre, ' ', en.apellido_paterno)  AS responsable_nuevo,
            ua.nombre                                    AS ubicacion_anterior,
            un.nombre                                    AS ubicacion_nueva,
            ur.username                                  AS registrado_por
         FROM mobiliario_movimiento mm
         INNER JOIN mobiliario  mob ON mob.pk_mobiliario  = mm.fk_mobiliario
         LEFT JOIN  empleado    ea  ON ea.pk_empleado     = mm.fk_responsable_anterior
         LEFT JOIN  empleado    en  ON en.pk_empleado     = mm.fk_responsable_nuevo
         LEFT JOIN  ubicacion   ua  ON ua.pk_ubicacion    = mm.fk_ubicacion_anterior
         LEFT JOIN  ubicacion   un  ON un.pk_ubicacion    = mm.fk_ubicacion_nueva
         LEFT JOIN  users       ur  ON ur.pk_user         = mm.registrado_por
         ${where}
         ORDER BY mm.fecha DESC`,
        params
    );
};