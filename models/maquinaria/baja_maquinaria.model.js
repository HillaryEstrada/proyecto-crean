// ============================================
// MODELO: baja_maquinaria.model.js
// Descripción: Manejo de bajas de maquinaria
// ============================================

const Conexion = require('../../config/database');

module.exports = {

    // ============================================
    // Registrar baja de maquinaria
    // ============================================
    // Esta función hace DOS cosas:
    // 1. Inserta el registro en baja_maquinaria (historial)
    // 2. Actualiza el estado de la maquinaria a 'baja'
    // Se usa transacción para mantener integridad de datos
    // ============================================
    registrarBaja: async (data) => {
        const client = await Conexion.connect();

        try {
            // Iniciar transacción
            await client.query('BEGIN');

            // 1. Insertar en tabla baja_maquinaria
            await client.query(
                `INSERT INTO baja_maquinaria
                (fk_maquinaria, tipo_baja, motivo, documento_respaldo, autorizado_por, registrado_por)
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    data.fk_maquinaria,
                    data.tipo_baja,
                    data.motivo,
                    data.documento_respaldo,
                    data.autorizado_por,
                    data.registrado_por
                ]
            );

            // 2. Actualizar estado en maquinaria
            await client.query(
                `UPDATE maquinaria
                 SET estado_operativo = 'baja'
                 WHERE pk_maquinaria = $1`,
                [data.fk_maquinaria]
            );

            // Confirmar cambios
            await client.query('COMMIT');

        } catch (error) {
            // Si algo falla, se revierte todo
            await client.query('ROLLBACK');
            throw error;

        } finally {
            // Liberar conexión
            client.release();
        }
    }

};