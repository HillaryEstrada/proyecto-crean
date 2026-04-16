// ============================================
// MODELO: expediente.model.js
// Descripción: Consultas SQL para el expediente de activos
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // MAQUINARIA - INFO GENERAL
    // ============================================
    obtenerInfoGeneralMaquinaria: (id) => Conexion.query(
        `SELECT
            m.*,
            te.nombre AS tipo_nombre,
            u.nombre AS ubicacion_nombre,
            f.numero_factura,
            f.fecha_factura,
            f.costo_adquisicion,
            f.pdf_factura,
            g.fecha_inicio AS garantia_inicio,
            g.fecha_fin AS garantia_fin,
            g.limite_horas,
            g.limite_km,
            g.garantia_pdf,
            usr.username AS registrado_por_usuario
        FROM maquinaria m
        LEFT JOIN tipo_equipo te ON m.fk_tipo = te.pk_tipo_equipo
        LEFT JOIN ubicacion u ON m.fk_ubicacion = u.pk_ubicacion
        LEFT JOIN factura f ON m.fk_factura = f.pk_factura
        LEFT JOIN garantia g ON m.fk_garantia = g.pk_garantia
        LEFT JOIN users usr ON m.registrado_por = usr.pk_user
        WHERE m.pk_maquinaria = $1`,
        [id]
    ),

    // ============================================
    // MAQUINARIA - HISTORIAL DE EVENTOS
    // ============================================
    obtenerEventosMaquinaria: (id) => Conexion.query(
        `SELECT
            e.pk_evento,
            e.tipo_evento,
            e.descripcion,
            e.fk_referencia,
            e.fecha_registro,
            usr.username AS registrado_por_usuario
        FROM evento_activo e
        LEFT JOIN users usr ON e.registrado_por = usr.pk_user
        WHERE e.tipo_activo = 'maquinaria'
          AND e.fk_maquinaria = $1
        ORDER BY e.fecha_registro DESC`,
        [id]
    ),

    // ============================================
    // MAQUINARIA - USO (HORAS)
    // ============================================
    obtenerUsoMaquinaria: (id) => Conexion.query(
        `SELECT
            mh.pk_registro,
            mh.tipo_registro,
            mh.horas,
            mh.combustible_litros,
            mh.actividad_realizada,
            mh.observaciones,
            mh.foto_tablero,
            mh.ticket_combustible,
            mh.fecha_registro,
            u.nombre AS ubicacion_nombre,
            usr.username AS registrado_por_usuario
        FROM maquinaria_hora mh
        LEFT JOIN ubicacion u ON mh.fk_ubicacion = u.pk_ubicacion
        LEFT JOIN users usr ON mh.registrado_por = usr.pk_user
        WHERE mh.fk_maquinaria = $1
        ORDER BY mh.fecha_registro DESC`,
        [id]
    ),

    // ============================================
    // MAQUINARIA - HISTORIAL DE UBICACIONES
    // ============================================
    obtenerUbicacionesMaquinaria: (id) => Conexion.query(
        `SELECT
            mhu.pk_historial,
            mhu.motivo,
            mhu.fecha_registro,
            ua.nombre AS ubicacion_anterior,
            un.nombre AS ubicacion_nueva,
            usr.username AS registrado_por_usuario
        FROM maquinaria_historial_ubicacion mhu
        LEFT JOIN ubicacion ua ON mhu.fk_ubicacion_anterior = ua.pk_ubicacion
        LEFT JOIN ubicacion un ON mhu.fk_ubicacion_nueva = un.pk_ubicacion
        LEFT JOIN users usr ON mhu.registrado_por = usr.pk_user
        WHERE mhu.fk_maquinaria = $1
        ORDER BY mhu.fecha_registro DESC`,
        [id]
    ),

    // ============================================
    // MAQUINARIA - MANTENIMIENTOS
    // ============================================
    obtenerMantenimientoMaquinaria: (id) => Conexion.query(
        `SELECT
            mt.pk_mantenimiento,
            mt.tipo_mantenimiento,
            mt.fecha_servicio,
            mt.horas_maquina,
            mt.costo_mano_obra,
            mt.estado_equipo,
            mt.estado_mantenimiento,
            mt.proximo_mantenimiento_horas,
            mt.proximo_mantenimiento_fecha,
            mt.observaciones,
            mt.foto_evidencia,
            mt.fecha_registro,
            ts.nombre AS tipo_servicio_nombre,
            emp.nombre AS empleado_nombre,
            emp.apellido_paterno AS empleado_apellido,
            prov.nombre AS proveedor_nombre,
            usr.username AS registrado_por_usuario
        FROM mantenimiento mt
        LEFT JOIN tipo_servicio ts ON mt.fk_tipo_servicio = ts.pk_tipo_servicio
        LEFT JOIN empleado emp ON mt.fk_empleado = emp.pk_empleado
        LEFT JOIN proveedor prov ON mt.fk_proveedor = prov.pk_proveedor
        LEFT JOIN users usr ON mt.registrado_por = usr.pk_user
        WHERE mt.tipo_activo = 'maquinaria'
          AND mt.fk_maquinaria = $1
        ORDER BY mt.fecha_servicio DESC`,
        [id]
    ),

    // ============================================
    // MAQUINARIA - FALLAS
    // ============================================
    obtenerFallasMaquinaria: (id) => Conexion.query(
        `SELECT
            f.pk_falla,
            f.descripcion,
            f.fecha_reporte,
            f.estado,
            f.fecha_resolucion,
            f.accion_tomada,
            f.fk_mantenimiento,
            f.fecha_registro,
            usr.username AS reportado_por_usuario
        FROM falla f
        LEFT JOIN users usr ON f.reportado_por = usr.pk_user
        WHERE f.tipo_activo = 'maquinaria'
          AND f.fk_maquinaria = $1
        ORDER BY f.fecha_reporte DESC`,
        [id]
    ),

    // ============================================
    // MAQUINARIA - CHECKLIST
    // ============================================
    obtenerChecklistMaquinaria: (id) => Conexion.query(
        `SELECT
            cd.pk_checklist,
            cd.fecha,
            cd.nivel_aceite,
            cd.nivel_refrigerante,
            cd.filtro_aire,
            cd.presion_llantas,
            cd.nivel_combustible,
            cd.engrase_puntos,
            cd.inspeccion_visual,
            cd.observaciones,
            cd.hora_registro,
            cd.fecha_registro,
            usr.username AS realizado_por_usuario
        FROM checklist_diario cd
        LEFT JOIN users usr ON cd.realizado_por = usr.pk_user
        WHERE cd.tipo_activo = 'maquinaria'
          AND cd.fk_maquinaria = $1
        ORDER BY cd.fecha DESC`,
        [id]
    ),

    // ============================================
    // VEHICULO - INFO GENERAL
    // ============================================
    obtenerInfoGeneralVehiculo: (id) => Conexion.query(
        `SELECT
            v.*,
            te.nombre AS tipo_nombre,
            u.nombre AS ubicacion_nombre,
            f.numero_factura,
            f.fecha_factura,
            f.costo_adquisicion,
            f.pdf_factura,
            g.fecha_inicio AS garantia_inicio,
            g.fecha_fin AS garantia_fin,
            g.limite_horas,
            g.limite_km,
            g.garantia_pdf,
            usr.username AS registrado_por_usuario
        FROM vehiculo v
        LEFT JOIN tipo_equipo te ON v.fk_tipo = te.pk_tipo_equipo
        LEFT JOIN ubicacion u ON v.fk_ubicacion = u.pk_ubicacion
        LEFT JOIN factura f ON v.fk_factura = f.pk_factura
        LEFT JOIN garantia g ON v.fk_garantia = g.pk_garantia
        LEFT JOIN users usr ON v.registrado_por = usr.pk_user
        WHERE v.pk_vehiculo = $1`,
        [id]
    ),

    // ============================================
    // VEHICULO - HISTORIAL DE EVENTOS
    // ============================================
    obtenerEventosVehiculo: (id) => Conexion.query(
        `SELECT
            e.pk_evento,
            e.tipo_evento,
            e.descripcion,
            e.fk_referencia,
            e.fecha_registro,
            usr.username AS registrado_por_usuario
        FROM evento_activo e
        LEFT JOIN users usr ON e.registrado_por = usr.pk_user
        WHERE e.tipo_activo = 'vehiculo'
          AND e.fk_vehiculo = $1
        ORDER BY e.fecha_registro DESC`,
        [id]
    ),

    // ============================================
    // VEHICULO - USO (BITÁCORA)
    // ============================================
    obtenerUsoVehiculo: (id) => Conexion.query(
        `SELECT
            vb.pk_registro,
            vb.kilometraje,
            vb.combustible_litros,
            vb.observaciones,
            vb.foto_tablero,
            vb.ticket_combustible,
            vb.fecha_registro,
            u.nombre AS ubicacion_nombre,
            usr.username AS registrado_por_usuario
        FROM vehiculo_bitacora vb
        LEFT JOIN ubicacion u ON vb.fk_ubicacion = u.pk_ubicacion
        LEFT JOIN users usr ON vb.registrado_por = usr.pk_user
        WHERE vb.fk_vehiculo = $1
        ORDER BY vb.fecha_registro DESC`,
        [id]
    ),

    // ============================================
    // VEHICULO - MANTENIMIENTOS
    // ============================================
    obtenerMantenimientoVehiculo: (id) => Conexion.query(
        `SELECT
            mt.pk_mantenimiento,
            mt.tipo_mantenimiento,
            mt.fecha_servicio,
            mt.kilometraje,
            mt.costo_mano_obra,
            mt.estado_equipo,
            mt.estado_mantenimiento,
            mt.proximo_mantenimiento_km,
            mt.proximo_mantenimiento_fecha,
            mt.observaciones,
            mt.foto_evidencia,
            mt.fecha_registro,
            ts.nombre AS tipo_servicio_nombre,
            emp.nombre AS empleado_nombre,
            emp.apellido_paterno AS empleado_apellido,
            prov.nombre AS proveedor_nombre,
            usr.username AS registrado_por_usuario
        FROM mantenimiento mt
        LEFT JOIN tipo_servicio ts ON mt.fk_tipo_servicio = ts.pk_tipo_servicio
        LEFT JOIN empleado emp ON mt.fk_empleado = emp.pk_empleado
        LEFT JOIN proveedor prov ON mt.fk_proveedor = prov.pk_proveedor
        LEFT JOIN users usr ON mt.registrado_por = usr.pk_user
        WHERE mt.tipo_activo = 'vehiculo'
          AND mt.fk_vehiculo = $1
        ORDER BY mt.fecha_servicio DESC`,
        [id]
    ),

    // ============================================
    // VEHICULO - FALLAS
    // ============================================
    obtenerFallasVehiculo: (id) => Conexion.query(
        `SELECT
            f.pk_falla,
            f.descripcion,
            f.fecha_reporte,
            f.estado,
            f.fecha_resolucion,
            f.accion_tomada,
            f.fk_mantenimiento,
            f.fecha_registro,
            usr.username AS reportado_por_usuario
        FROM falla f
        LEFT JOIN users usr ON f.reportado_por = usr.pk_user
        WHERE f.tipo_activo = 'vehiculo'
          AND f.fk_vehiculo = $1
        ORDER BY f.fecha_reporte DESC`,
        [id]
    ),

    // ============================================
    // VEHICULO - CHECKLIST
    // ============================================
    obtenerChecklistVehiculo: (id) => Conexion.query(
        `SELECT
            cd.pk_checklist,
            cd.fecha,
            cd.nivel_aceite,
            cd.nivel_refrigerante,
            cd.filtro_aire,
            cd.presion_llantas,
            cd.nivel_combustible,
            cd.engrase_puntos,
            cd.inspeccion_visual,
            cd.observaciones,
            cd.hora_registro,
            cd.fecha_registro,
            usr.username AS realizado_por_usuario
        FROM checklist_diario cd
        LEFT JOIN users usr ON cd.realizado_por = usr.pk_user
        WHERE cd.tipo_activo = 'vehiculo'
          AND cd.fk_vehiculo = $1
        ORDER BY cd.fecha DESC`,
        [id]
    )

};