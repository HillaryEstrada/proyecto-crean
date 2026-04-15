// ============================================
// CONTROLADOR: expediente.controller.js
// Descripción: Construye y devuelve el JSON completo del expediente
// ============================================

const expediente = require('../../models/maquinaria/expediente.model');


// GET /maquinaria/:id/expediente
// Devuelve todo el expediente de una máquina en un solo JSON estructurado
exports.obtenerExpediente = async (req, res) => {
    const { id } = req.params;

    try {
        // Ejecutar todas las consultas en paralelo para mejor rendimiento
        const [
            resDatos,
            resKpis,
            resAlertas,
            resHistorial,
            resUso,
            resMantenimientos,
            resFallas,
            resChecklist,
        ] = await Promise.all([
            expediente.obtenerDatosBase(id),
            expediente.obtenerKpis(id),
            expediente.obtenerAlertas(id),
            expediente.obtenerHistorial(id),
            expediente.obtenerUso(id),
            expediente.obtenerMantenimientos(id),
            expediente.obtenerFallas(id),
            expediente.obtenerChecklist(id),
        ]);

        // Validar que la máquina existe
        if (!resDatos.rows.length) {
            return res.status(404).json({ error: 'Maquinaria no encontrada' });
        }

        const row = resDatos.rows[0];

        // Separar datos de maquinaria, factura y garantía del mismo row
        const maquinaria = {
            pk_maquinaria:    row.pk_maquinaria,
            numero_economico: row.numero_economico,
            tipo_equipo:      row.tipo_equipo,
            marca:            row.marca,
            modelo:           row.modelo,
            anio:             row.anio,
            ubicacion:        row.ubicacion,
            estado_operativo: row.estado_operativo,
        };

        const factura = row.pk_factura ? {
            pk_factura:      row.pk_factura,
            numero_factura:  row.numero_factura,
            fecha_compra:    row.fecha_compra,
            proveedor:       row.proveedor,
            monto_total:     row.factura_monto,
        } : null;

        const garantia = row.pk_garantia ? {
            pk_garantia:      row.pk_garantia,
            numero_garantia:  row.numero_garantia,
            fecha_inicio:     row.garantia_inicio,
            fecha_fin:        row.garantia_fin,
            proveedor:        row.garantia_proveedor,
            estado:           row.garantia_estado,
        } : null;

        res.json({
            maquinaria,
            factura,
            garantia,
            kpis:            resKpis.rows[0]         || {},
            alertas:         resAlertas.rows          || [],
            historial:       resHistorial.rows        || [],
            uso:             resUso.rows              || [],
            mantenimientos:  resMantenimientos.rows   || [],
            fallas:          resFallas.rows           || [],
            checklist:       resChecklist.rows        || [],
        });

    } catch (error) {
        console.error('Error al obtener expediente:', error);
        res.status(500).json({ error: error.message });
    }
};