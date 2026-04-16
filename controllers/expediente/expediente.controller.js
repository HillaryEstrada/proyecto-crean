// ============================================
// CONTROLADOR: expediente.controller.js
// Descripción: Agrega y devuelve el expediente completo de un activo
// ============================================

const expediente = require('../../models/expediente/expediente.model');

// ============================================
// CONTROLADOR: EXPEDIENTE MAQUINARIA
// ============================================
exports.obtenerExpedienteMaquinaria = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la maquinaria exista
        const infoResult = await expediente.obtenerInfoGeneralMaquinaria(id);

        if (!infoResult.rows.length) {
            return res.status(404).json({ error: 'Maquinaria no encontrada' });
        }

        // Consultar todo en paralelo
        const [
            eventos,
            uso,
            ubicaciones,
            mantenimiento,
            fallas,
            checklist
        ] = await Promise.all([
            expediente.obtenerEventosMaquinaria(id),
            expediente.obtenerUsoMaquinaria(id),
            expediente.obtenerUbicacionesMaquinaria(id),
            expediente.obtenerMantenimientoMaquinaria(id),
            expediente.obtenerFallasMaquinaria(id),
            expediente.obtenerChecklistMaquinaria(id)
        ]);

        const info = infoResult.rows[0];

        res.json({
            info: {
                pk_maquinaria: info.pk_maquinaria,
                numero_economico: info.numero_economico,
                numero_inventario_seder: info.numero_inventario_seder,
                tipo_nombre: info.tipo_nombre,
                descripcion: info.descripcion,
                marca: info.marca,
                modelo: info.modelo,
                anio: info.anio,
                color: info.color,
                serie: info.serie,
                horas_actuales: info.horas_actuales,
                combustible_litros: info.combustible_litros,
                estado_fisico: info.estado_fisico,
                estado_operativo: info.estado_operativo,
                ubicacion_nombre: info.ubicacion_nombre,
                foto_maquina: info.foto_maquina,
                registrado_por_usuario: info.registrado_por_usuario,
                fecha_registro: info.fecha_registro
            },
            factura: {
                numero_factura: info.numero_factura,
                fecha_factura: info.fecha_factura,
                costo_adquisicion: info.costo_adquisicion,
                pdf_factura: info.pdf_factura
            },
            garantia: {
                fecha_inicio: info.garantia_inicio,
                fecha_fin: info.garantia_fin,
                limite_horas: info.limite_horas,
                limite_km: info.limite_km,
                garantia_pdf: info.garantia_pdf
            },
            historial: eventos.rows,
            uso: uso.rows,
            ubicaciones: ubicaciones.rows,
            mantenimiento: mantenimiento.rows,
            fallas: fallas.rows,
            checklist: checklist.rows
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// CONTROLADOR: EXPEDIENTE VEHICULO
// ============================================
exports.obtenerExpedienteVehiculo = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el vehículo exista
        const infoResult = await expediente.obtenerInfoGeneralVehiculo(id);

        if (!infoResult.rows.length) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }

        // Consultar todo en paralelo
        const [
            eventos,
            uso,
            mantenimiento,
            fallas,
            checklist
        ] = await Promise.all([
            expediente.obtenerEventosVehiculo(id),
            expediente.obtenerUsoVehiculo(id),
            expediente.obtenerMantenimientoVehiculo(id),
            expediente.obtenerFallasVehiculo(id),
            expediente.obtenerChecklistVehiculo(id)
        ]);

        const info = infoResult.rows[0];

        res.json({
            info: {
                pk_vehiculo: info.pk_vehiculo,
                numero_economico: info.numero_economico,
                numero_inventario_gob: info.numero_inventario_gob,
                tipo_nombre: info.tipo_nombre,
                marca: info.marca,
                modelo: info.modelo,
                anio: info.anio,
                kilometraje_actual: info.kilometraje_actual,
                gasolina_litros: info.gasolina_litros,
                estado_fisico: info.estado_fisico,
                estado_operativo: info.estado_operativo,
                ubicacion_nombre: info.ubicacion_nombre,
                foto_vehiculo: info.foto_vehiculo,
                registrado_por_usuario: info.registrado_por_usuario,
                fecha_registro: info.fecha_registro
            },
            factura: {
                numero_factura: info.numero_factura,
                fecha_factura: info.fecha_factura,
                costo_adquisicion: info.costo_adquisicion,
                pdf_factura: info.pdf_factura
            },
            garantia: {
                fecha_inicio: info.garantia_inicio,
                fecha_fin: info.garantia_fin,
                limite_horas: info.limite_horas,
                limite_km: info.limite_km,
                garantia_pdf: info.garantia_pdf
            },
            historial: eventos.rows,
            uso: uso.rows,
            ubicaciones: [],
            mantenimiento: mantenimiento.rows,
            fallas: fallas.rows,
            checklist: checklist.rows
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};