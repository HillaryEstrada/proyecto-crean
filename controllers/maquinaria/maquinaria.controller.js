// ============================================
// CONTROLLER: maquinaria.controller.js
// ============================================

const Maquinaria = require('../../models/maquinaria/maquinaria.model');

// ── GET /maquinaria/tipos ──────────────────
exports.getTipos = async (req, res) => {
    try {
        const result = await Maquinaria.listarTipos();
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener tipos de equipo:', error);
        res.status(500).json({ ok: false, message: 'Error al obtener tipos de equipo' });
    }
};

// ── POST /maquinaria/tipos ─────────────────
exports.crearTipo = async (req, res) => {
    try {
        const { nombre } = req.body;

        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ ok: false, message: 'El nombre es requerido' });
        }

        const result = await Maquinaria.crearTipo(nombre.trim());

        res.json({
            ok:     true,
            id:     result.rows[0].pk_tipo,
            nombre: result.rows[0].nombre
        });
    } catch (error) {
        console.error('Error al crear tipo de equipo:', error);
        if (error.code === '23505') {
            return res.status(400).json({ ok: false, message: `El tipo "${req.body.nombre}" ya existe` });
        }
        res.status(500).json({ ok: false, message: 'Error al crear tipo de equipo' });
    }
};

// ── GET /maquinaria/ubicaciones ────────────
exports.getUbicaciones = async (req, res) => {
    try {
        const result = await Maquinaria.listarUbicaciones();
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener ubicaciones:', error);
        res.status(500).json({ ok: false, message: 'Error al obtener ubicaciones' });
    }
};

// ── GET /maquinaria/proveedores ────────────
exports.getProveedores = async (req, res) => {
    try {
        const result = await Maquinaria.listarProveedores();
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        res.status(500).json({ ok: false, message: 'Error al obtener proveedores' });
    }
};

// ── POST /maquinaria/proveedores ───────────
exports.crearProveedor = async (req, res) => {
    try {
        const { nombre, direccion, telefono, correo } = req.body;

        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ ok: false, message: 'El nombre del proveedor es requerido' });
        }

        const result = await Maquinaria.crearProveedor({
            nombre:    nombre.trim(),
            direccion: direccion  || null,
            telefono:  telefono   || null,
            correo:    correo     || null
        });

        res.json({
            ok:     true,
            id:     result.rows[0].pk_proveedor,
            nombre: result.rows[0].nombre
        });
    } catch (error) {
        console.error('Error al crear proveedor:', error);
        res.status(500).json({ ok: false, message: 'Error al crear proveedor' });
    }
};

// ── GET /maquinaria ────────────────────────
exports.getMaquinaria = async (req, res) => {
    try {
        const result = await Maquinaria.listar();
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener maquinaria:', error);
        res.status(500).json({ ok: false, message: 'Error al obtener maquinaria' });
    }
};

// ── GET /maquinaria/:id ────────────────────
exports.getMaquinariaById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Maquinaria.obtenerPorId(id);

        if (result.rows.length === 0) {
            return res.status(404).json({ ok: false, message: 'Maquinaria no encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener maquinaria por ID:', error);
        res.status(500).json({ ok: false, message: 'Error al obtener maquinaria' });
    }
};

// ── POST /maquinaria ───────────────────────
exports.crearMaquinaria = async (req, res) => {
    try {
        const {
            numero_economico, numero_inventario_seder, fk_ubicacion,
            marca, modelo, anio, color, serie, descripcion,
            estado_fisico    = 'bueno',
            estado_operativo = 'disponible',
            foto_maquina,
            numero_factura, fecha_factura, costo_adquisicion, pdf_factura, fk_proveedor,
            garantia_inicio, garantia_fin, limite_horas, garantia_pdf
        } = req.body;

        if (!numero_economico) {
            return res.status(400).json({ ok: false, message: 'El número económico es requerido' });
        }

        const estadosFisicosValidos = ['bueno', 'regular', 'malo'];
        if (estado_fisico && !estadosFisicosValidos.includes(estado_fisico)) {
            return res.status(400).json({ ok: false, message: 'Estado físico inválido. Valores: bueno, regular, malo' });
        }

        const estadosOperativosValidos = ['disponible', 'prestada', 'en_uso', 'mantenimiento', 'revision', 'baja'];
        if (estado_operativo && !estadosOperativosValidos.includes(estado_operativo)) {
            return res.status(400).json({ ok: false, message: 'Estado operativo inválido' });
        }

        // Factura
        let fk_factura = null;
        if (numero_factura && fecha_factura) {
            const resF = await Maquinaria.crearFactura({ numero_factura, fecha_factura, costo_adquisicion, pdf_factura, fk_proveedor });
            fk_factura = resF.rows[0].pk_factura;
        }

        // Garantía
        let fk_garantia = null;
        if (garantia_inicio || garantia_fin || limite_horas) {
            const resG = await Maquinaria.crearGarantia({ fecha_inicio: garantia_inicio, fecha_fin: garantia_fin, limite_horas, garantia_pdf });
            fk_garantia = resG.rows[0].pk_garantia;
        }

        const resMaq = await Maquinaria.crear({
            numero_economico, numero_inventario_seder,
            fk_tipo, descripcion, marca, modelo, anio, color, serie,
            estado_fisico, estado_operativo,
            fk_ubicacion, fk_factura, fk_garantia,
            foto_maquina,
            registrado_por: req.user?.pk_user || null
        });

        res.json({
            ok:            true,
            pk_maquinaria: resMaq.rows[0].pk_maquinaria,
            message:       'Maquinaria registrada exitosamente'
        });
    } catch (error) {
        console.error('Error al crear maquinaria:', error);
        if (error.code === '23505') {
            return res.status(400).json({ ok: false, message: 'Ya existe una maquinaria con ese número económico o serie' });
        }
        res.status(500).json({ ok: false, message: 'Error al registrar maquinaria' });
    }
};

// ── PUT /maquinaria/:id ────────────────────
exports.actualizarMaquinaria = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            fk_tipo, fk_ubicacion, marca, modelo, anio, color, serie, descripcion,
            estado_fisico, estado_operativo,
            numero_factura, fecha_factura, costo_adquisicion, pdf_factura, fk_proveedor,
            garantia_inicio, garantia_fin, limite_horas, garantia_pdf
        } = req.body;

        const existe = await Maquinaria.obtenerPorId(id);
        if (existe.rows.length === 0) {
            return res.status(404).json({ ok: false, message: 'Maquinaria no encontrada' });
        }

        const maqActual = existe.rows[0];

        // Factura: crear si no existe y llegan datos
        let fk_factura = maqActual.fk_factura || null;
        if (numero_factura && fecha_factura && !fk_factura) {
            const resF = await Maquinaria.crearFactura({ numero_factura, fecha_factura, costo_adquisicion, pdf_factura, fk_proveedor });
            fk_factura = resF.rows[0].pk_factura;
        }

        // Garantía: crear si no existe y llegan datos
        let fk_garantia = maqActual.fk_garantia || null;
        if ((garantia_inicio || garantia_fin || limite_horas) && !fk_garantia) {
            const resG = await Maquinaria.crearGarantia({ fecha_inicio: garantia_inicio, fecha_fin: garantia_fin, limite_horas, garantia_pdf });
            fk_garantia = resG.rows[0].pk_garantia;
        }

        await Maquinaria.actualizar(id, {
            fk_tipo, marca, modelo, anio, color, serie, descripcion,
            estado_fisico, estado_operativo,
            fk_ubicacion, fk_factura, fk_garantia
        });

        res.json({ ok: true, message: 'Maquinaria actualizada exitosamente' });
    } catch (error) {
        console.error('Error al actualizar maquinaria:', error);
        if (error.code === '23505') {
            return res.status(400).json({ ok: false, message: 'Número económico o serie ya existe en otro registro' });
        }
        res.status(500).json({ ok: false, message: 'Error al actualizar maquinaria' });
    }
};

// ── PATCH /maquinaria/:id/desactivar ───────
exports.desactivarMaquinaria = async (req, res) => {
    try {
        const { id } = req.params;

        const existe = await Maquinaria.obtenerPorId(id);
        if (existe.rows.length === 0) {
            return res.status(404).json({ ok: false, message: 'Maquinaria no encontrada' });
        }

        await Maquinaria.desactivar(id);
        res.json({ ok: true, message: 'Maquinaria dada de baja exitosamente' });
    } catch (error) {
        console.error('Error al desactivar maquinaria:', error);
        res.status(500).json({ ok: false, message: 'Error al dar de baja la maquinaria' });
    }
};

// ── DELETE /maquinaria/:id ─────────────────
exports.eliminarMaquinaria = async (req, res) => {
    try {
        const { id } = req.params;

        const existe = await Maquinaria.obtenerPorId(id);
        if (existe.rows.length === 0) {
            return res.status(404).json({ ok: false, message: 'Maquinaria no encontrada' });
        }

        await Maquinaria.desaparecer(id);
        res.json({ ok: true, message: 'Maquinaria eliminada permanentemente' });
    } catch (error) {
        console.error('Error al eliminar maquinaria:', error);
        res.status(500).json({ ok: false, message: 'Error al eliminar maquinaria' });
    }
};

// ── GET /maquinaria/bajas ──────────────────
exports.getMaquinariasBajas = async (req, res) => {
    try {
        const result = await Maquinaria.listarBajas();
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener bajas:', error);
        res.status(500).json({ ok: false, message: 'Error al obtener maquinaria de baja' });
    }

    
};
exports.getCategoriasUbicacion = async (req, res) => {
    try {
        const result = await Maquinaria.listarCategoriasUbicacion();
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener categorías' });
    }
};