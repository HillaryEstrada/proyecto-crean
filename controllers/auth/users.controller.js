// ============================================
// CONTROLADOR: users.controller.js
// Descripción: CRUD de usuarios del sistema
// ============================================

const bcrypt = require('bcryptjs');
const User   = require('../../models/auth/users.model');
const config = require('../../config/auth.config');

// CREAR - Nuevo usuario
exports.crear = async (req, res) => {
    try {
        const { username, password, fk_rol, fk_empleado } = req.body;

        if (!username || !password || !fk_rol || !fk_empleado) {
            return res.status(400).json({ 
                error: 'username, password, rol y empleado son requeridos' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                error: 'La contraseña debe tener al menos 6 caracteres' 
            });
        }

        const usernameExiste = await User.existeUsername(username);
    if (usernameExiste.rows.length > 0) {
        return res.status(400).json({ 
            error: 'El nombre de usuario ya está en uso' 
        });
    }

        const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

        const result = await User.crear({
            username,
            password_hash: passwordHash,
            fk_rol,
            fk_empleado
        });

        res.json({ 
            mensaje: 'Usuario creado exitosamente',
            userId: result.rows[0].pk_user
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ error: error.message });
    }
};

// LISTAR - Todos los usuarios activos
exports.listar = async (req, res) => {
    try {
        const data = await User.listar();
        res.json(data.rows);
    } catch (error) {
        console.error('Error al listar usuarios:', error);
        res.status(500).json({ error: error.message });
    }
};

// OBTENER - Usuario por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const data = await User.obtenerPorId(req.params.id);
        if (data.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(data.rows[0]);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: error.message });
    }
};

// ACTUALIZAR - Usuario existente
exports.actualizar = async (req, res) => {
    try {
        const { username, fk_rol, fk_empleado, cambiar_password, nueva_password } = req.body;

        if (!username || !fk_rol || !fk_empleado) {
            return res.status(400).json({ 
                error: 'username, rol y empleado son requeridos' 
            });
        }

        const usernameExiste = await User.existeUsername(username, req.params.id);
        if (usernameExiste.rows.length > 0) {
            return res.status(400).json({ 
                error: 'El nombre de usuario ya está en uso por otro usuario' 
            });
        }

        await User.actualizar(req.params.id, { username, fk_rol, fk_empleado });

        if (cambiar_password && nueva_password) {
            if (nueva_password.length < 6) {
                return res.status(400).json({ 
                    error: 'La nueva contraseña debe tener al menos 6 caracteres' 
                });
            }
            const passwordHash = await bcrypt.hash(nueva_password, config.bcrypt.saltRounds);
            await User.actualizarPassword(req.params.id, passwordHash);
        }

        res.json({ mensaje: 'Usuario actualizado exitosamente' });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ error: error.message });
    }
};

// DESACTIVAR - Usuario (soft delete)
exports.desactivar = async (req, res) => {
    try {
        await User.desactivar(req.params.id);
        res.json({ mensaje: 'Usuario desactivado exitosamente' });
    } catch (error) {
        console.error('Error al desactivar usuario:', error);
        res.status(500).json({ error: error.message });
    }
};

// ELIMINAR - Usuario permanentemente
exports.desaparecer = async (req, res) => {
    try {
        await User.desaparecer(req.params.id);
        res.json({ mensaje: 'Usuario eliminado permanentemente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ 
            error: 'No se puede eliminar: el usuario tiene datos asociados' 
        });
    }
};