// ============================================
// MODELO: vehiculo.model.js
// Descripción: Consultas SQL para vehículos
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Crear vehículo
    // ============================================
    crear: (data) => Conexion.query(
        `INSERT INTO vehiculo 
        (numero_economico, numero_inventario_gob, fk_tipo, marca, modelo, anio,
         vin, placas, color,
         kilometraje_actual, gasolina_litros, estado_fisico, estado_operativo, 
         fk_ubicacion, fk_factura, foto_vehiculo, registrado_por) 
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *`,
        [
            data.numero_economico,
            data.numero_inventario_gob || null,
            data.fk_tipo,
            data.marca                 || null,
            data.modelo                || null,
            data.anio                  || null,
            data.vin                   || null,
            data.placas                || null,
            data.color                 || null,
            data.kilometraje_actual    || 0,
            data.gasolina_litros       || 0,
            data.estado_fisico         || 'bueno',
            data.estado_operativo      || 'disponible',
            data.fk_ubicacion,
            data.fk_factura            || null,
            data.foto_vehiculo         || null,
            data.registrado_por
        ]
    ),

    // ============================================
    // Listar vehículos activos (NO en baja)
    // ============================================
    listar: () => Conexion.query(
        `SELECT 
            v.*,
            te.nombre as tipo_nombre,
            u.nombre  as ubicacion_nombre,
            f.numero_factura,
            f.fecha_factura,
            f.garantia_duracion_dias,
            f.garantia_limite_km,
            usr.username as registrado_por_usuario
        FROM vehiculo v
        LEFT JOIN tipo_equipo te ON v.fk_tipo      = te.pk_tipo_equipo
        LEFT JOIN ubicacion   u  ON v.fk_ubicacion  = u.pk_ubicacion
        LEFT JOIN factura     f  ON v.fk_factura    = f.pk_factura
        LEFT JOIN users      usr ON v.registrado_por = usr.pk_user
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
            u.nombre  as ubicacion_nombre,
            f.numero_factura,
            f.fecha_factura,
            f.costo_adquisicion,
            f.pdf_factura,
            f.garantia_duracion_dias,
            f.garantia_limite_km,
            usr.username as registrado_por_usuario
        FROM vehiculo v
        LEFT JOIN tipo_equipo te ON v.fk_tipo      = te.pk_tipo_equipo
        LEFT JOIN ubicacion   u  ON v.fk_ubicacion  = u.pk_ubicacion
        LEFT JOIN factura     f  ON v.fk_factura    = f.pk_factura
        LEFT JOIN users      usr ON v.registrado_por = usr.pk_user
        WHERE v.pk_vehiculo = $1`,
        [id]
    ),

     // ============================================
    // Actualizar vehículo
    // ============================================
    actualizar: (id, data) => Conexion.query(
        `UPDATE vehiculo 
SET 
    numero_economico      = COALESCE($1,  numero_economico),
    numero_inventario_gob = COALESCE($2,  numero_inventario_gob),
    fk_tipo               = COALESCE($3,  fk_tipo),
    marca                 = COALESCE($4,  marca),
    modelo                = COALESCE($5,  modelo),
    anio                  = COALESCE($6,  anio),
    vin                   = COALESCE($7,  vin),
    placas                = COALESCE($8,  placas),
    color                 = COALESCE($9,  color),
    kilometraje_actual    = COALESCE($10, kilometraje_actual),
    gasolina_litros       = COALESCE($11, gasolina_litros),
    estado_fisico         = COALESCE($12, estado_fisico),
    estado_operativo      = COALESCE($13, estado_operativo),
    fk_ubicacion          = COALESCE($14, fk_ubicacion),
    fk_factura            = COALESCE($15, fk_factura),
    foto_vehiculo         = COALESCE($16, foto_vehiculo)
WHERE pk_vehiculo = $17
RETURNING *`,
        [
            data.numero_economico,
            data.numero_inventario_gob,
            data.fk_tipo,
            data.marca,
            data.modelo,
            data.anio,
            data.vin,
            data.placas,
            data.color,
            data.kilometraje_actual,
            data.gasolina_litros,
            data.estado_fisico,
            data.estado_operativo,
            data.fk_ubicacion,
            data.fk_factura,
            data.foto_vehiculo,
            id
        ]
    ),
    
    // ============================================
    // Desactivar (Baja lógica)
    // ============================================
    desactivar: (id) => Conexion.query(
        `UPDATE vehiculo 
         SET estado_operativo = 'baja' 
         WHERE pk_vehiculo = $1
         RETURNING *`,
        [id]
    ),

    // ============================================
    // Listar vehículos dados de baja
    // ============================================
    listarBajas: () => Conexion.query(
        `SELECT 
            v.*,
            te.nombre    as tipo_nombre,
            u.nombre     as ubicacion_nombre,
            usr.username as registrado_por_usuario
        FROM vehiculo v
        LEFT JOIN tipo_equipo te ON v.fk_tipo      = te.pk_tipo_equipo
        LEFT JOIN ubicacion   u  ON v.fk_ubicacion  = u.pk_ubicacion
        LEFT JOIN users      usr ON v.registrado_por = usr.pk_user
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
            data.motivo             || null,
            data.documento_respaldo || null,
            data.autorizado_por     || null,
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
            te.nombre    as tipo_nombre,
            usr.username as registrado_por_usuario
        FROM baja_vehiculo bv
        LEFT JOIN vehiculo    v   ON bv.fk_vehiculo   = v.pk_vehiculo
        LEFT JOIN tipo_equipo te  ON v.fk_tipo         = te.pk_tipo_equipo
        LEFT JOIN users      usr  ON bv.registrado_por  = usr.pk_user
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
            u.nombre  as ubicacion_nombre,
            usr.username as registrado_por_usuario
        FROM baja_vehiculo bv
        LEFT JOIN vehiculo    v   ON bv.fk_vehiculo   = v.pk_vehiculo
        LEFT JOIN tipo_equipo te  ON v.fk_tipo         = te.pk_tipo_equipo
        LEFT JOIN ubicacion   u   ON v.fk_ubicacion    = u.pk_ubicacion
        LEFT JOIN users      usr  ON bv.registrado_por  = usr.pk_user
        WHERE bv.pk_baja = $1`,
        [id]
    ),

    // Actualizar baja
    actualizarBaja: (id, data) => Conexion.query(
        `UPDATE baja_vehiculo
        SET tipo_baja=$1, motivo=$2, autorizado_por=$3, documento_respaldo=$4
        WHERE pk_baja=$5
        RETURNING *`,
        [
            data.tipo_baja,
            data.motivo             || null,
            data.autorizado_por     || null,
            data.documento_respaldo || null,
            id
        ]
    ),

    // ============================================
    // Verificar si vehículo ya tiene baja registrada
    // ============================================
    existeBaja: (fk_vehiculo) => Conexion.query(
        `SELECT pk_baja FROM baja_vehiculo
         WHERE fk_vehiculo = $1`,
        [fk_vehiculo]
    )

};