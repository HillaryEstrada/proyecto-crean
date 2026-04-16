// ============================================
// MODELO: vehiculo.model.js
// Descripción: Consultas SQL para vehiculo
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Crear vehiculo
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO vehiculo 
        (numero_economico, numero_inventario_gob, fk_tipo, marca, modelo, anio, 
         kilometraje_actual, gasolina_litros, estado_fisico, estado_operativo, 
         fk_ubicacion, fk_factura, fk_garantia, foto_vehiculo, registrado_por) 
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
            data.numero_economico,
            data.numero_inventario_gob || null,
            data.fk_tipo,
            data.marca,
            data.modelo,
            data.anio,
            data.kilometraje_actual || 0,
            data.gasolina_litros || 0,
            data.estado_fisico || 'bueno',
            data.estado_operativo || 'disponible',
            data.fk_ubicacion,
            data.fk_factura || null,
            data.fk_garantia || null,
            data.foto_vehiculo || null,
            data.registrado_por
        ]
    ),

    // ============================================
    // Listar vehiculos activos (NO en baja)
    // ============================================
    listar: () => Conexion.query(
        `SELECT 
            v.*,
            te.nombre as tipo_nombre,
            u.nombre as ubicacion_nombre,
            f.numero_factura,
            g.fecha_inicio,
            g.fecha_fin,
            usr.username as registrado_por_usuario
        FROM vehiculo v
        LEFT JOIN tipo_equipo te ON v.fk_tipo = te.pk_tipo_equipo
        LEFT JOIN ubicacion u ON v.fk_ubicacion = u.pk_ubicacion
        LEFT JOIN factura f ON v.fk_factura = f.pk_factura
        LEFT JOIN garantia g ON v.fk_garantia = g.pk_garantia
        LEFT JOIN users usr ON v.registrado_por = usr.pk_user
        WHERE v.estado_operativo != 'baja'
        ORDER BY v.pk_vehiculo ASC`
    ),

    // ============================================
    // Obtener por ID (con detalles completos)
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT 
            v.*,
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
    // Actualizar vehiculo
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE vehiculo 
SET 
    numero_economico = COALESCE($1, numero_economico),
    numero_inventario_gob = COALESCE($2, numero_inventario_gob),
    fk_tipo = COALESCE($3, fk_tipo),
    marca = COALESCE($4, marca),
    modelo = COALESCE($5, modelo),
    anio = COALESCE($6, anio),
    kilometraje_actual = COALESCE($7, kilometraje_actual),
    gasolina_litros = COALESCE($8, gasolina_litros),
    estado_fisico = COALESCE($9, estado_fisico),
    estado_operativo = COALESCE($10, estado_operativo),
    fk_ubicacion = COALESCE($11, fk_ubicacion),
    fk_factura = COALESCE($12, fk_factura),
    fk_garantia = COALESCE($13, fk_garantia),
    foto_vehiculo = COALESCE($14, foto_vehiculo)
WHERE pk_vehiculo = $15
RETURNING *`,
        [
            data.numero_economico,
            data.numero_inventario_gob,
            data.fk_tipo,
            data.marca,
            data.modelo,
            data.anio,
            data.kilometraje_actual,
            data.gasolina_litros,
            data.estado_fisico,
            data.estado_operativo,
            data.fk_ubicacion,
            data.fk_factura,
            data.fk_garantia,
            data.foto_vehiculo,
            id
        ]
    ),

    // ============================================
    // Desactivar (Baja lógica)
    // ============================================
    desactivar: (id) => Conexion.query(
        `UPDATE vehiculo 
         SET estado_operativo='baja' 
         WHERE pk_vehiculo=$1
         RETURNING *`,
        [id]
    ),

    // ============================================
    // Listar vehiculos dados de baja
    // ============================================
    listarBajas: () => Conexion.query(
        `SELECT 
            v.*,
            te.nombre as tipo_nombre,
            u.nombre as ubicacion_nombre,
            usr.username as registrado_por_usuario
        FROM vehiculo v
        LEFT JOIN tipo_equipo te ON v.fk_tipo = te.pk_tipo_equipo
        LEFT JOIN ubicacion u ON v.fk_ubicacion = u.pk_ubicacion
        LEFT JOIN users usr ON v.registrado_por = usr.pk_user
        WHERE v.estado_operativo = 'baja'
        ORDER BY v.pk_vehiculo ASC`
    ),

    // ============================================
    // Registrar baja (inserta en historial)
    // ============================================
    registrarBaja: (data) => Conexion.query(
        `INSERT INTO baja_vehiculo
        (fk_vehiculo, tipo_baja, motivo, documento_respaldo, autorizado_por, registrado_por)
        VALUES($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
            data.fk_vehiculo,
            data.tipo_baja,
            data.motivo || null,
            data.documento_respaldo || null,
            data.autorizado_por || null,
            data.registrado_por
        ]
    ),

    // ============================================
    // Listar historial de bajas registradas
    // ============================================
    listarBajasRegistradas: () => Conexion.query(
        `SELECT 
            bv.*,
            v.numero_economico,
            v.marca,
            v.modelo,
            v.anio,
            te.nombre as tipo_nombre,
            u1.username as autorizado_por_usuario,
            u2.username as registrado_por_usuario
        FROM baja_vehiculo bv
        LEFT JOIN vehiculo v ON bv.fk_vehiculo = v.pk_vehiculo
        LEFT JOIN tipo_equipo te ON v.fk_tipo = te.pk_tipo_equipo
        LEFT JOIN users u1 ON bv.autorizado_por = u1.pk_user
        LEFT JOIN users u2 ON bv.registrado_por = u2.pk_user
        ORDER BY bv.fecha_baja DESC`
    ),

    // ============================================
    // Obtener baja por ID (pk_baja)
    // ============================================
    obtenerBajaPorId: (id) => Conexion.query(
        `SELECT 
            bv.*,
            v.numero_economico,
            v.marca,
            v.modelo,
            v.anio,
            te.nombre as tipo_nombre,
            u.nombre as ubicacion_nombre,
            u1.username as autorizado_por_usuario,
            u2.username as registrado_por_usuario
        FROM baja_vehiculo bv
        LEFT JOIN vehiculo v ON bv.fk_vehiculo = v.pk_vehiculo
        LEFT JOIN tipo_equipo te ON v.fk_tipo = te.pk_tipo_equipo
        LEFT JOIN ubicacion u ON v.fk_ubicacion = u.pk_ubicacion
        LEFT JOIN users u1 ON bv.autorizado_por = u1.pk_user
        LEFT JOIN users u2 ON bv.registrado_por = u2.pk_user
        WHERE bv.pk_baja = $1`,
        [id]
    ),

    // ============================================
    // Verificar si vehiculo ya tiene baja registrada
    // ============================================
    existeBaja: (fk_vehiculo) => Conexion.query(
        `SELECT pk_baja FROM baja_vehiculo
         WHERE fk_vehiculo = $1`,
        [fk_vehiculo]
    )

};