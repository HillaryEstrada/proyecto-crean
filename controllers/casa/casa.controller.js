
const Casa = require('../../models/casa/casa.model'); // Importa el modelo de Casas

// Crear un nuevo Casa
exports.crear = async (req, res) => {
    try {
        await Casa.crear(req.body); // Inserta los datos del body
        res.json({ mensaje: 'Casa creado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message }); // Maneja errores (ej: email duplicado)
    }
};

// Listar todos los Casas activos
exports.listar = async (req, res) => {
    try {
        const data = await Casa.listar(); // Obtiene todos los Casas
        res.json(data.rows); // Devuelve solo las filas
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener un Casa específico por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await Casa.obtenerPorId(req.params.id);
        res.json(data.rows[0]); // Devuelve solo el primer registro
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar un Casa existente
exports.actualizar = async (req, res) => {
    try {
        await Casa.actualizar(req.params.id, req.body); // Actualiza con el ID de la URL
        res.json({ mensaje: 'Casa actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Desactivar Casa (soft delete)
exports.desactivar = async (req, res) => {
    try {
        await Casa.desactivar(req.params.id);
        res.json({ mensaje: 'Casa desactivado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar Casa permanentemente (hard delete)
exports.desaparecer = async (req, res) => {
    try {
        await Casa.desaparecer(req.params.id);
        res.json({ mensaje: 'Casa eliminado permanentemente' });
    } catch (error) {
        // Si tiene pedidos asociados, PostgreSQL lanzará error por la FK RESTRICT
        res.status(500).json({ error: 'No se puede eliminar: el Casa tiene pedidos asociados' });
    }
};