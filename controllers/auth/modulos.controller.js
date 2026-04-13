// ============================================
// CONTROLADOR: modulos.controller.js
// Descripción: Gestión de módulos y asignación a roles y usuarios
// ============================================

const Modulo = require('../../models/auth/modulos.model');
const Rol    = require('../../models/auth/roles.model');

// LISTAR - Todos los módulos del sistema
exports.listar = async (req, res) => {
    try {
        const data = await Modulo.listar();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar módulos:', error);
        res.status(500).json({ error: error.message });
    }
};

// LISTAR ROLES - Para el selector de la UI
exports.listarRoles = async (req, res) => {
    try {
        const data = await Rol.listar();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar roles:', error);
        res.status(500).json({ error: error.message });
    }
};

// OBTENER - Módulos de un rol (con campo asignado: true/false)
exports.obtenerPorRol = async (req, res) => {
    try {
        const data = await Modulo.obtenerPorRol(req.params.id);
        res.json(data.rows);
    } catch (error) {
        console.error('Error al obtener módulos del rol:', error);
        res.status(500).json({ error: error.message });
    }
};

// ASIGNAR - Guardar módulos de un rol
exports.asignarArol = async (req, res) => {
    try {
        const { modulos } = req.body;

        if (!Array.isArray(modulos)) {
            return res.status(400).json({ 
                error: 'Se esperaba un array de IDs de módulos' 
            });
        }

        await Modulo.asignarArol(req.params.id, modulos);
        res.json({ mensaje: 'Módulos asignados correctamente' });

    } catch (error) {
        console.error('Error al asignar módulos:', error);
        res.status(500).json({ error: error.message });
    }
};

// OBTENER - Módulos de un usuario (base rol + excepciones individuales)
exports.obtenerPorUser = async (req, res) => {
    try {
        const { fk_rol } = req.query;

        if (!fk_rol) {
            return res.status(400).json({ 
                error: 'Se requiere fk_rol como query param' 
            });
        }

        const data = await Modulo.obtenerPorUser(req.params.id, fk_rol);
        res.json(data.rows);

    } catch (error) {
        console.error('Error al obtener módulos del usuario:', error);
        res.status(500).json({ error: error.message });
    }
};

// GUARDAR - Excepciones individuales de un usuario
exports.guardarExcepcionesUser = async (req, res) => {
    try {
        const { agregar, quitar } = req.body;

        if (!Array.isArray(agregar) || !Array.isArray(quitar)) {
            return res.status(400).json({ 
                error: 'Se esperaban arrays agregar[] y quitar[]' 
            });
        }

        await Modulo.guardarExcepcionesUser(req.params.id, agregar, quitar);
        res.json({ mensaje: 'Módulos del usuario actualizados correctamente' });

    } catch (error) {
        console.error('Error al guardar excepciones del usuario:', error);
        res.status(500).json({ error: error.message });
    }
};