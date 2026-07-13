// ============================================
// CONTROLADOR: documento.controller.js
// ============================================

const Documento = require('../../models/documento/documento.model');

const TIPOS_VALIDOS  = ['autorizacion_salida', 'guia_traslado', 'recibo_recepcion', 'oficio_comodato', 'penalizacion', 'otro'];
const ESTADOS_VALIDOS = ['borrador', 'emitido', 'cancelado'];

// Validación de campos obligatorios
function validarDocumento(body) {
    const { tipo_documento, numero_folio } = body;
    if (!tipo_documento) return 'El campo tipo_documento es obligatorio';
    if (!numero_folio)   return 'El campo numero_folio es obligatorio';
    if (!TIPOS_VALIDOS.includes(tipo_documento))
        return `tipo_documento debe ser: ${TIPOS_VALIDOS.join(', ')}`;
    return null;
}

// Listar documentos activos (no cancelados)
exports.listar = async (req, res) => {
    try {
        const data = await Documento.listar();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar documentos:', error);
        res.status(500).json({ error: error.message });
    }
};

// Listar todos los documentos
exports.listarTodos = async (req, res) => {
    try {
        const data = await Documento.listarTodos();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar todos los documentos:', error);
        res.status(500).json({ error: error.message });
    }
};

// Obtener documento por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await Documento.obtenerPorId(req.params.id);
        if (!data.rows.length)
            return res.status(404).json({ error: 'Documento no encontrado' });
        res.json(data.rows[0]);
    } catch (error) {
        console.error('Error al obtener documento:', error);
        res.status(500).json({ error: error.message });
    }
};

// Listar documentos por comodato
exports.listarPorComodato = async (req, res) => {
    try {
        const data = await Documento.listarPorComodato(req.params.fk_comodato);
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar documentos por comodato:', error);
        res.status(500).json({ error: error.message });
    }
};

// Listar documentos por tipo
exports.listarPorTipo = async (req, res) => {
    const { tipo_documento } = req.params;
    if (!TIPOS_VALIDOS.includes(tipo_documento))
        return res.status(400).json({ error: `tipo_documento debe ser: ${TIPOS_VALIDOS.join(', ')}` });

    try {
        const data = await Documento.listarPorTipo(tipo_documento);
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar documentos por tipo:', error);
        res.status(500).json({ error: error.message });
    }
};

// Crear documento
exports.crear = async (req, res) => {
    const error = validarDocumento(req.body);
    if (error) return res.status(400).json({ error });

    try {
        // Verificar folio duplicado
        const folioExiste = await Documento.existePorFolio(req.body.numero_folio);
        if (folioExiste.rows.length)
            return res.status(400).json({ error: 'El número de folio ya existe' });

        const resultado = await Documento.crear({
            ...req.body,
            registrado_por: req.user.id
        });
        res.json({ mensaje: 'Documento creado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        console.error('Error al crear documento:', error);
        res.status(500).json({ error: error.message });
    }
};

// Actualizar documento
exports.actualizar = async (req, res) => {
    const error = validarDocumento(req.body);
    if (error) return res.status(400).json({ error });

    try {
        // Verificar folio duplicado (excluyendo el actual)
        if (req.body.numero_folio) {
            const folioExiste = await Documento.existePorFolio(req.body.numero_folio, req.params.id);
            if (folioExiste.rows.length)
                return res.status(400).json({ error: 'El número de folio ya está asignado a otro documento' });
        }

        const resultado = await Documento.actualizar(req.params.id, {
            ...req.body,
            actualizado_por: req.user.id
        });
        if (!resultado.rows.length)
            return res.status(404).json({ error: 'Documento no encontrado' });
        res.json({ mensaje: 'Documento actualizado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        console.error('Error al actualizar documento:', error);
        res.status(500).json({ error: error.message });
    }
};

// Cambiar estado del documento
exports.cambiarEstado = async (req, res) => {
    const { estado } = req.body;
    if (!ESTADOS_VALIDOS.includes(estado))
        return res.status(400).json({ error: `estado debe ser: ${ESTADOS_VALIDOS.join(', ')}` });

    try {
        const resultado = await Documento.cambiarEstado(req.params.id, estado, req.user.id);
        if (!resultado.rows.length)
            return res.status(404).json({ error: 'Documento no encontrado' });
        res.json({ mensaje: 'Estado actualizado exitosamente', data: resultado.rows[0] });
    } catch (error) {
        console.error('Error al cambiar estado del documento:', error);
        res.status(500).json({ error: error.message });
    }
};

// Eliminar documento (cancelación lógica)
exports.eliminar = async (req, res) => {
    try {
        const resultado = await Documento.eliminar(req.params.id, req.user.id);
        if (!resultado.rows.length)
            return res.status(404).json({ error: 'Documento no encontrado' });
        res.json({ mensaje: 'Documento eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar documento:', error);
        res.status(500).json({ error: error.message });
    }
};