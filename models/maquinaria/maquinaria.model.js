// ============================================
// MODELO: maquinaria.model.js
// Descripción: Consultas SQL para maquinaria
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Crear maquinaria
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO maquinaria 
        (numero_economico, numero_inventario_seder, fk_tipo, descripcion, marca, modelo, anio, 
         color, serie, numero_motor, horas_actuales, combustible_litros, estado_fisico, estado_operativo, 
         fk_ubicacion, fk_factura, fk_garantia, foto_maquina, registrado_por) 
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *`,
        [
            data.numero_economico,
            data.numero_inventario_seder || null,
            data.fk_tipo,
            data.descripcion,
            data.marca,
            data.modelo,
            data.anio,
            data.color || null,
            data.serie,
            data.numero_motor || null,
            data.horas_actuales || 0,
            data.combustible_litros || 0,
            data.estado_fisico || 'bueno',
            data.estado_operativo || 'disponible',
            data.fk_ubicacion,
            data.fk_factura || null,
            data.fk_garantia || null,
            data.foto_maquina || null,
            data.registrado_por
        ]
    ),

    // ============================================
    // Listar maquinaria activa (NO en baja)
    // ============================================
    listar: () => Conexion.query(
        `SELECT 
            m.*,
            te.nombre as tipo_nombre,
            u.nombre as ubicacion_nombre,
            f.numero_factura,
            f.fecha_factura,
            g.fecha_inicio,
            g.fecha_fin,
            usr.username as registrado_por_usuario
        FROM maquinaria m
        LEFT JOIN tipo_equipo te ON m.fk_tipo = te.pk_tipo_equipo
        LEFT JOIN ubicacion u ON m.fk_ubicacion = u.pk_ubicacion
        LEFT JOIN factura f ON m.fk_factura = f.pk_factura
        LEFT JOIN garantia g ON m.fk_garantia = g.pk_garantia
        LEFT JOIN users usr ON m.registrado_por = usr.pk_user
        WHERE m.estado_operativo != 'baja'
        ORDER BY m.pk_maquinaria ASC`
    ),

    // ============================================
    // Obtener por ID (con detalles completos)
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT 
            m.*,
            te.nombre as tipo_nombre,
            u.nombre as ubicacion_nombre,
            f.numero_factura,
            f.fecha_factura,
            f.costo_adquisicion,
            g.fecha_inicio,
            g.fecha_fin,
            g.limite_horas,
            g.limite_km,
            usr.username as registrado_por_usuario
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
    // Actualizar maquinaria
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE maquinaria 
SET 
    numero_economico = COALESCE($1, numero_economico),
    numero_inventario_seder = COALESCE($2, numero_inventario_seder),
    fk_tipo = COALESCE($3, fk_tipo),
    descripcion = COALESCE($4, descripcion),
    marca = COALESCE($5, marca),
    modelo = COALESCE($6, modelo),
    anio = COALESCE($7, anio),
    color = COALESCE($8, color),
    serie = COALESCE($9, serie),
    numero_motor = COALESCE($10, numero_motor),
    horas_actuales = COALESCE($11, horas_actuales),
    combustible_litros = COALESCE($12, combustible_litros),
    estado_fisico = COALESCE($13, estado_fisico),
    estado_operativo = COALESCE($14, estado_operativo),
    fk_ubicacion = COALESCE($15, fk_ubicacion),
    fk_factura = COALESCE($16, fk_factura),
    fk_garantia = COALESCE($17, fk_garantia),
    foto_maquina = COALESCE($18, foto_maquina)
WHERE pk_maquinaria = $19
RETURNING *`,
        [
            data.numero_economico,
            data.numero_inventario_seder,
            data.fk_tipo,
            data.descripcion,
            data.marca,
            data.modelo,
            data.anio,
            data.color,
            data.serie,
            data.numero_motor,
            data.horas_actuales,
            data.combustible_litros,
            data.estado_fisico,
            data.estado_operativo,
            data.fk_ubicacion,
            data.fk_factura,
            data.fk_garantia,
            data.foto_maquina,
            id
        ]
    ),

    // ============================================
    // Desactivar (Baja lógica)
    // ============================================
    desactivar: (id) => Conexion.query(
        `UPDATE maquinaria 
         SET estado_operativo='baja' 
         WHERE pk_maquinaria=$1
         RETURNING *`,
        [id]
    ),

    // ============================================
    // Listar maquinaria dada de baja
    // ============================================
    listarBajas: () => Conexion.query(
        `SELECT 
            m.*,
            te.nombre as tipo_nombre,
            u.nombre as ubicacion_nombre,
            usr.username as registrado_por_usuario
        FROM maquinaria m
        LEFT JOIN tipo_equipo te ON m.fk_tipo = te.pk_tipo_equipo
        LEFT JOIN ubicacion u ON m.fk_ubicacion = u.pk_ubicacion
        LEFT JOIN users usr ON m.registrado_por = usr.pk_user
        WHERE m.estado_operativo = 'baja'
        ORDER BY m.pk_maquinaria ASC`
    ),

    // ============================================
    // Registrar baja (inserta en historial)
    // ============================================
    registrarBaja: (data) => Conexion.query(
        `INSERT INTO baja_maquinaria
        (fk_maquinaria, tipo_baja, motivo, documento_respaldo, autorizado_por, autorizado_por_nombre, registrado_por)
        VALUES($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
            data.fk_maquinaria,
            data.tipo_baja,
            data.motivo              || null,
            data.documento_respaldo  || null,
            data.autorizado_por      || null,
            data.autorizado_por_nombre || null,
            data.registrado_por
        ]
    ),

    // ============================================
    // Listar historial de bajas registradas
    // ============================================
    listarBajasRegistradas: () => Conexion.query(
        `SELECT 
            bm.*,
            m.numero_economico,
            m.marca,
            m.modelo,
            m.anio,
            te.nombre as tipo_nombre,
            u1.username as autorizado_por_usuario,
            u2.username as registrado_por_usuario
        FROM baja_maquinaria bm
        LEFT JOIN maquinaria m ON bm.fk_maquinaria = m.pk_maquinaria
        LEFT JOIN tipo_equipo te ON m.fk_tipo = te.pk_tipo_equipo
        LEFT JOIN users u1 ON bm.autorizado_por = u1.pk_user
        LEFT JOIN users u2 ON bm.registrado_por = u2.pk_user
        ORDER BY bm.fecha_baja DESC`
    ),

    // ============================================
    // Obtener baja por ID (pk_baja)
    // ============================================
    obtenerBajaPorId: (id) => Conexion.query(
        `SELECT 
            bm.*,
            m.numero_economico,
            m.marca,
            m.modelo,
            m.anio,
            te.nombre as tipo_nombre,
            u.nombre as ubicacion_nombre,
            u1.username as autorizado_por_usuario,
            u2.username as registrado_por_usuario
        FROM baja_maquinaria bm
        LEFT JOIN maquinaria m ON bm.fk_maquinaria = m.pk_maquinaria
        LEFT JOIN tipo_equipo te ON m.fk_tipo = te.pk_tipo_equipo
        LEFT JOIN ubicacion u ON m.fk_ubicacion = u.pk_ubicacion
        LEFT JOIN users u1 ON bm.autorizado_por = u1.pk_user
        LEFT JOIN users u2 ON bm.registrado_por = u2.pk_user
        WHERE bm.pk_baja = $1`,
        [id]
    ),

    // ============================================
    // Verificar si maquinaria ya tiene baja registrada
    // ============================================
    existeBaja: (fk_maquinaria) => Conexion.query(
        `SELECT pk_baja FROM baja_maquinaria
         WHERE fk_maquinaria = $1`,
        [fk_maquinaria]
    )

};