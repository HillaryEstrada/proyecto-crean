
const Computadora = require('../../models/ejemplos/computadora.model'); // Importa el modelo de Computadoras

// Crear un nuevo Computadora
exports.crear = async (req, res) => {
    try {
        await Computadora.crear(req.body); // Inserta los datos del body
        res.json({ mensaje: 'Computadora creado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message }); // Maneja errores (ej: email duplicado)
    }
};

// Listar todos los Computadoras activos
exports.listar = async (req, res) => {
    try {
        const data = await Computadora.listar(); // Obtiene todos los Computadoras
        res.json(data.rows); // Devuelve solo las filas
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener un Computadora específico por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await Computadora.obtenerPorId(req.params.id);
        res.json(data.rows[0]); // Devuelve solo el primer registro
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar un Computadora existente
exports.actualizar = async (req, res) => {
    try {
        await Computadora.actualizar(req.params.id, req.body); // Actualiza con el ID de la URL
        res.json({ mensaje: 'Computadora actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Desactivar Computadora (soft delete)
exports.desactivar = async (req, res) => {
    try {
        await Computadora.desactivar(req.params.id);
        res.json({ mensaje: 'Computadora desactivado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar Computadora permanentemente (hard delete)
exports.desaparecer = async (req, res) => {
    try {
        await Computadora.desaparecer(req.params.id);
        res.json({ mensaje: 'Computadora eliminado permanentemente' });
    } catch (error) {
        // Si tiene pedidos asociados, PostgreSQL lanzará error por la FK RESTRICT
        res.status(500).json({ error: 'No se puede eliminar: el Computadora tiene pedidos asociados' });
    }
};