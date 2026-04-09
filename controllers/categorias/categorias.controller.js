
const Categoria = require('../../models/categorias/categorias.model'); // Importa el modelo de Categorias

// Crear un nuevo Categoria
exports.crear = async (req, res) => {
    try {
        await Categoria.crear(req.body); // Inserta los datos del body
        res.json({ mensaje: 'Categoria creado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message }); // Maneja errores (ej: email duplicado)
    }
};

// Listar todos los Categorias activos
exports.listar = async (req, res) => {
    try {
        const data = await Categoria.listar(); // Obtiene todos los Categorias
        res.json(data.rows); // Devuelve solo las filas
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener un Categoria específico por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await Categoria.obtenerPorId(req.params.id);
        res.json(data.rows[0]); // Devuelve solo el primer registro
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar un Categoria existente
exports.actualizar = async (req, res) => {
    try {
        await Categoria.actualizar(req.params.id, req.body); // Actualiza con el ID de la URL
        res.json({ mensaje: 'Categoria actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Desactivar Categoria (soft delete)
exports.desactivar = async (req, res) => {
    try {
        await Categoria.desactivar(req.params.id);
        res.json({ mensaje: 'Categoria desactivado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar Categoria permanentemente (hard delete)
exports.desaparecer = async (req, res) => {
    try {
        await Categoria.desaparecer(req.params.id);
        res.json({ mensaje: 'Categoria eliminado permanentemente' });
    } catch (error) {
        // Si tiene pedidos asociados, PostgreSQL lanzará error por la FK RESTRICT
        res.status(500).json({ error: 'No se puede eliminar: el Categoria tiene pedidos asociados' });
    }
};