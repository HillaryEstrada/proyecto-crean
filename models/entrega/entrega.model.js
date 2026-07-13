// ============================================
// MODELO: entrega.model.js
// Descripción: Consultas SQL para entrega_comodato
// Tablas usadas (schema public): entrega_comodato,
// comodato_detalle, maquinaria, comodato, users
//
// NOTA: Conexion solo expone Conexion.query(text, params),
// sin getClient(). Por lo tanto crear() NO ejecuta una
// transacción real (no hay BEGIN/COMMIT/ROLLBACK). Cada paso
// es un query independiente. Ver el orden de pasos abajo.
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Listar todas las entregas
    // ============================================
    listar: () => Conexion.query(
        `SELECT 
            e.*,
            cd.fk_comodato,
            cd.fk_maquinaria,
            cd.horas_salida as horas_salida_detalle,
            m.numero_economico,
            m.marca,
            m.modelo,
            usr.username as registrado_por_usuario
        FROM entrega_comodato e
        LEFT JOIN comodato_detalle cd ON e.fk_detalle     = cd.pk_detalle
        LEFT JOIN maquinaria        m ON cd.fk_maquinaria = m.pk_maquinaria
        LEFT JOIN users           usr ON e.registrado_por = usr.pk_user
        ORDER BY e.pk_entrega ASC`
    ),

    // ============================================
    // Obtener por ID (con detalles completos)
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT 
            e.*,
            cd.fk_comodato,
            cd.fk_maquinaria,
            cd.horas_salida as horas_salida_detalle,
            cd.estado_entrega,
            m.numero_economico,
            m.marca,
            m.modelo,
            m.estado_operativo,
            usr.username as registrado_por_usuario
        FROM entrega_comodato e
        LEFT JOIN comodato_detalle cd ON e.fk_detalle     = cd.pk_detalle
        LEFT JOIN maquinaria        m ON cd.fk_maquinaria = m.pk_maquinaria
        LEFT JOIN users           usr ON e.registrado_por = usr.pk_user
        WHERE e.pk_entrega = $1`,
        [id]
    ),

    // ============================================
    // Obtener entrega por fk_detalle (UNIQUE)
    // ============================================
    obtenerPorDetalle: (fk_detalle) => Conexion.query(
        `SELECT * FROM entrega_comodato WHERE fk_detalle = $1`,
        [fk_detalle]
    ),

    // ============================================
    // Crear entrega completa (SIN transacción real)
    //
    // Orden de pasos (sin ROLLBACK disponible, se ordena para
    // minimizar inconsistencias ante una falla a la mitad):
    //
    //   1) Validar que el detalle existe (solo lectura)
    //   2) Validar que no exista ya una entrega para ese detalle
    //      (fk_detalle es UNIQUE en entrega_comodato)
    //   3) Insertar la entrega (paso "fuente de verdad")
    //   4) Actualizar comodato_detalle (horas_salida, estado_entrega)
    //   5) Actualizar maquinaria (estado_operativo = 'prestada').
    //      NO se toca fk_ubicacion: la ubicación física de campo
    //      (ubicacion_entrega) es texto libre y no corresponde a
    //      la tabla ubicacion.
    //   6) Marcar el comodato como 'activo'
    //
    // Si algún paso del 4 al 6 falla, la entrega (paso 3) ya quedó
    // guardada y no se revierte sola. El controlador debe capturar
    // el error y devolver el pk_entrega ya creado para seguimiento.
    // ============================================
    crear: async (data) => {
        // 1) Validar que el detalle existe
        const { rows: detalleRows } = await Conexion.query(
            `SELECT pk_detalle, fk_comodato, fk_maquinaria
             FROM comodato_detalle
             WHERE pk_detalle = $1`,
            [data.fk_detalle]
        );
        const detalle = detalleRows[0];
        if (!detalle) {
            throw new Error('El fk_detalle indicado no existe en comodato_detalle');
        }

        // 2) Validar que no exista ya una entrega para ese detalle
        const { rows: existeRows } = await Conexion.query(
            `SELECT pk_entrega FROM entrega_comodato WHERE fk_detalle = $1`,
            [data.fk_detalle]
        );
        if (existeRows[0]) {
            throw new Error('Ya existe una entrega registrada para este detalle');
        }

        // 3) Insertar la entrega
        const { rows } = await Conexion.query(
            `INSERT INTO entrega_comodato
            (fk_detalle, fecha_entrega, nombre_receptor, cargo_receptor,
             ubicacion_entrega, fotos_entrega, estado_motor, estado_llantas,
             estado_asiento, nivel_combustible, rayones, descripcion_rayones,
             piezas_faltantes, observaciones_checklist, registrado_por)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *`,
            [
                data.fk_detalle,
                data.fecha_entrega,
                data.nombre_receptor,
                data.cargo_receptor          || null,
                data.ubicacion_entrega       || null,
                data.fotos_entrega           || null,
                data.estado_motor            || 'bueno',
                data.estado_llantas          || 'bueno',
                data.estado_asiento          || 'bueno',
                data.nivel_combustible       || 'lleno',
                data.rayones                 || false,
                data.descripcion_rayones     || null,
                data.piezas_faltantes        || null,
                data.observaciones_checklist || null,
                data.registrado_por          || null
            ]
        );
        const entrega = rows[0];

        // 4) Actualizar comodato_detalle (horas_salida, estado_entrega)
        //
        // estado_entrega NO se calcula aquí. No existe una fórmula
        // documentada que combine estado_motor + estado_llantas +
        // estado_asiento + rayones en un solo valor bueno/regular/malo.
        // El modelo espera que data.estado_entrega venga ya resuelto
        // desde el controlador (o el formulario). Si no se envía,
        // la columna conserva su valor anterior (COALESCE).
        await Conexion.query(
            `UPDATE comodato_detalle
             SET horas_salida         = COALESCE($1, horas_salida),
                 estado_entrega       = COALESCE($2, estado_entrega),
                 fecha_actualizacion  = CURRENT_TIMESTAMP
             WHERE pk_detalle = $3`,
            [
                data.horas_salida    || null,
                data.estado_entrega  || null,
                detalle.pk_detalle
            ]
        );

        // 5) Actualizar maquinaria (solo estado_operativo, NO fk_ubicacion)
        if (detalle.fk_maquinaria) {
            await Conexion.query(
                `UPDATE maquinaria
                 SET estado_operativo = 'prestada'
                 WHERE pk_maquinaria = $1`,
                [detalle.fk_maquinaria]
            );
        }

        // 6) Marcar el comodato como activo
        await Conexion.query(
            `UPDATE comodato
             SET estado = 'activo',
                 fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE pk_comodato = $1`,
            [detalle.fk_comodato]
        );

        return entrega;
    },

    // ============================================
    // Eliminar entrega (DELETE físico)
    // ============================================
    eliminar: (id) => Conexion.query(
        `DELETE FROM entrega_comodato WHERE pk_entrega = $1 RETURNING pk_entrega`,
        [id]
    ),

    // ============================================
    // Verificar existencia por ID
    // ============================================
    existe: (id) => Conexion.query(
        `SELECT pk_entrega FROM entrega_comodato WHERE pk_entrega = $1`,
        [id]
    )

};