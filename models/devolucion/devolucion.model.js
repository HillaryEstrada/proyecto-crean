// ============================================
// MODELO: devolucion.model.js
// Descripción: Consultas SQL para devolucion_comodato
// Tablas usadas (schema public): devolucion_comodato,
// comodato_detalle, maquinaria, falla, comodato, users
//
// NOTA IMPORTANTE:
// Conexion solo expone Conexion.query(text, params), sin
// getClient(). Por lo tanto crear() NO ejecuta una transacción
// real (no hay BEGIN/COMMIT/ROLLBACK): cada paso es un query
// independiente contra el pool. Si un paso falla a la mitad,
// los pasos anteriores YA quedaron guardados y no se revierten
// solos. El orden de los pasos está pensado para minimizar el
// daño de una falla parcial (ver comentarios en cada paso).
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Listar todas las devoluciones
    // ============================================
    listar: () => Conexion.query(
        `SELECT 
            d.*,
            cd.fk_comodato,
            cd.fk_maquinaria,
            cd.horas_salida,
            m.numero_economico,
            m.marca,
            m.modelo,
            usr.username as registrado_por_usuario
        FROM devolucion_comodato d
        LEFT JOIN comodato_detalle cd ON d.fk_detalle     = cd.pk_detalle
        LEFT JOIN maquinaria        m ON cd.fk_maquinaria = m.pk_maquinaria
        LEFT JOIN users           usr ON d.registrado_por = usr.pk_user
        ORDER BY d.pk_devolucion ASC`
    ),

    // ============================================
    // Obtener por ID (con detalles completos)
    // ============================================
    obtenerPorId: (id) => Conexion.query(
        `SELECT 
            d.*,
            cd.fk_comodato,
            cd.fk_maquinaria,
            cd.horas_salida,
            cd.estado_entrega,
            m.numero_economico,
            m.marca,
            m.modelo,
            m.estado_operativo,
            usr.username as registrado_por_usuario
        FROM devolucion_comodato d
        LEFT JOIN comodato_detalle cd ON d.fk_detalle     = cd.pk_detalle
        LEFT JOIN maquinaria        m ON cd.fk_maquinaria = m.pk_maquinaria
        LEFT JOIN users           usr ON d.registrado_por = usr.pk_user
        WHERE d.pk_devolucion = $1`,
        [id]
    ),

    // ============================================
    // Obtener devolución por fk_detalle (UNIQUE)
    // ============================================
    obtenerPorDetalle: (fk_detalle) => Conexion.query(
        `SELECT * FROM devolucion_comodato WHERE fk_detalle = $1`,
        [fk_detalle]
    ),

    // ============================================
    // Obtener el detalle del comodato a devolver
    // (fk_comodato y fk_maquinaria reales)
    // ============================================
    obtenerDetalleComodato: (fk_detalle) => Conexion.query(
        `SELECT pk_detalle, fk_comodato, fk_maquinaria
         FROM comodato_detalle
         WHERE pk_detalle = $1`,
        [fk_detalle]
    ),

    // ============================================
    // Crear devolución completa (SIN transacción real)
    //
    // Orden de ejecución pensado para minimizar inconsistencias
    // ante una falla a la mitad (no hay ROLLBACK disponible):
    //
    //   1) Validar que el detalle existe (solo lectura)
    //   2) Validar que no exista ya una devolución para ese detalle
    //      (fk_detalle es UNIQUE; si ya existe, se corta antes de
    //      escribir nada)
    //   3) Insertar la devolución (paso "fuente de verdad")
    //   4) Actualizar comodato_detalle (horas_regreso, estado_devolucion)
    //   5) Actualizar maquinaria (estado_operativo, horas_actuales)
    //   6) Si hay daños, registrar falla
    //   7) Si ya no quedan detalles pendientes, cerrar el comodato
    //
    // Si algún paso del 4 al 7 falla, la devolución (paso 3) ya
    // quedó guardada — revisar manualmente o reintentar el ajuste
    // correspondiente. El controlador debe capturar el error y
    // devolver al usuario el pk_devolucion ya creado para que se
    // pueda dar seguimiento.
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

        // 2) Validar que no exista ya una devolución para ese detalle
        const { rows: existeRows } = await Conexion.query(
            `SELECT pk_devolucion FROM devolucion_comodato WHERE fk_detalle = $1`,
            [data.fk_detalle]
        );
        if (existeRows[0]) {
            throw new Error('Ya existe una devolución registrada para este detalle');
        }

        // 3) Insertar la devolución
        const { rows } = await Conexion.query(
            `INSERT INTO devolucion_comodato
            (fk_detalle, fecha_devolucion, horas_lectura_horometro, tipo_devolucion,
             tiene_danos, requiere_mantenimiento, estado_cierre,
             estado_motor, estado_llantas, nivel_combustible,
             rayones_nuevos, descripcion_danos, foto_tablero, fotos_devolucion,
             observaciones, registrado_por)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *`,
            [
                data.fk_detalle,
                data.fecha_devolucion,
                data.horas_lectura_horometro || null,
                data.tipo_devolucion         || 'voluntaria',
                data.tiene_danos             || false,
                data.requiere_mantenimiento  || false,
                data.estado_cierre           || 'conforme',
                data.estado_motor            || null,
                data.estado_llantas          || null,
                data.nivel_combustible       || null,
                data.rayones_nuevos          || false,
                data.descripcion_danos       || null,
                data.foto_tablero            || null,
                data.fotos_devolucion        || null,
                data.observaciones           || null,
                data.registrado_por          || null
            ]
        );
        const devolucion = rows[0];

        // 4) Actualizar comodato_detalle (horas_regreso, estado_devolucion)
        //
        // estado_devolucion NO se calcula aquí. No existe una fórmula
        // documentada que combine estado_motor + estado_llantas + daños +
        // combustible en un solo valor bueno/regular/malo. Por eso el
        // modelo espera que data.estado_devolucion venga ya resuelto
        // desde el controlador (o el formulario). Si no se envía, la
        // columna conserva su valor anterior (COALESCE).
        await Conexion.query(
            `UPDATE comodato_detalle
             SET horas_regreso        = COALESCE($1, horas_regreso),
                 estado_devolucion    = COALESCE($2, estado_devolucion),
                 fecha_actualizacion  = CURRENT_TIMESTAMP
             WHERE pk_detalle = $3`,
            [
                data.horas_lectura_horometro || null,
                data.estado_devolucion       || null,
                detalle.pk_detalle
            ]
        );

        // 5) Actualizar maquinaria (estado_operativo, horas_actuales)
        const nuevoEstadoOperativo = data.tiene_danos ? 'mantenimiento' : 'disponible';
        if (detalle.fk_maquinaria) {
            await Conexion.query(
                `UPDATE maquinaria
                 SET estado_operativo = $1,
                     horas_actuales   = COALESCE($2, horas_actuales)
                 WHERE pk_maquinaria = $3`,
                [nuevoEstadoOperativo, data.horas_lectura_horometro || null, detalle.fk_maquinaria]
            );
        }

        // 6) Si hay daños, crear falla automáticamente
        if (data.tiene_danos) {
            await Conexion.query(
                `INSERT INTO falla
                   (fk_detalle, tipo, urgencia, descripcion, estado, origen, fecha_reporte)
                 VALUES ($1, 'dano_devolucion', 'normal', $2, 'pendiente', 'devolucion', CURRENT_DATE)`,
                [
                    detalle.pk_detalle,
                    data.descripcion_danos || 'Daño detectado en devolución de comodato'
                ]
            );
        }

        // 7) Cerrar el comodato solo si ya no quedan detalles sin devolución
        const { rows: pendientesRows } = await Conexion.query(
            `SELECT COUNT(*)::int AS pendientes
             FROM comodato_detalle cd
             WHERE cd.fk_comodato = $1
               AND NOT EXISTS (
                 SELECT 1 FROM devolucion_comodato dc WHERE dc.fk_detalle = cd.pk_detalle
               )`,
            [detalle.fk_comodato]
        );
        const pendientes = pendientesRows[0].pendientes;

        if (pendientes === 0) {
            await Conexion.query(
                `UPDATE comodato
                 SET estado = 'finalizado',
                     fecha_devolucion_real = CURRENT_DATE,
                     fecha_actualizacion = CURRENT_TIMESTAMP
                 WHERE pk_comodato = $1`,
                [detalle.fk_comodato]
            );
        }

        return devolucion;
    },

    // ============================================
    // Eliminar devolución (DELETE físico)
    // ============================================
    eliminar: (id) => Conexion.query(
        `DELETE FROM devolucion_comodato WHERE pk_devolucion = $1 RETURNING pk_devolucion`,
        [id]
    ),

    // ============================================
    // Verificar existencia por ID
    // ============================================
    existe: (id) => Conexion.query(
        `SELECT pk_devolucion FROM devolucion_comodato WHERE pk_devolucion = $1`,
        [id]
    )

};