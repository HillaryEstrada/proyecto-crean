// ============================================
// CONTROLADOR: users.controller.js
// Descripción: CRUD de usuarios del sistema
// ============================================

const bcrypt = require('bcryptjs');
const User = require('../../models/auth/users.model');
const config = require('../../config/auth.config');

// CREAR - Nuevo usuario
exports.crear = async (req, res) => {
    try {
        const { username, email, password, nombre_completo, fk_rol } = req.body;

        // Validar campos requeridos
        if (!username || !email || !password || !nombre_completo || !fk_rol) {
            return res.status(400).json({ 
                error: 'Todos los campos son requeridos' 
            });
        }

        // Validar longitud de contraseña
        if (password.length < 6) {
            return res.status(400).json({ 
                error: 'La contraseña debe tener al menos 6 caracteres' 
            });
        }

        // Verificar si el username ya existe
        const usernameExiste = await User.existeUsername(username);
        if (usernameExiste.rows.length > 0) {
            return res.status(400).json({ 
                error: 'El nombre de usuario ya está en uso' 
            });
        }

        // Verificar si el email ya existe
        const emailExiste = await User.existeEmail(email);
        if (emailExiste.rows.length > 0) {
            return res.status(400).json({ 
                error: 'El email ya está registrado' 
            });
        }

        // Encriptar contraseña con bcrypt
        const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

        // Crear el usuario
        const result = await User.crear({
            username,
            email,
            password_hash: passwordHash,
            nombre_completo,
            fk_rol
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

// LISTAR - Todos los usuarios
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
        const { username, email, nombre_completo, fk_rol, cambiar_password, nueva_password } = req.body;

        // Verificar si el username ya existe (excluyendo el usuario actual)
        const usernameExiste = await User.existeUsername(username, req.params.id);
        if (usernameExiste.rows.length > 0) {
            return res.status(400).json({ 
                error: 'El nombre de usuario ya está en uso por otro usuario' 
            });
        }

        // Verificar si el email ya existe (excluyendo el usuario actual)
        const emailExiste = await User.existeEmail(email, req.params.id);
        if (emailExiste.rows.length > 0) {
            return res.status(400).json({ 
                error: 'El email ya está registrado por otro usuario' 
            });
        }

        // Actualizar datos básicos del usuario
        await User.actualizar(req.params.id, {
            username,
            email,
            nombre_completo,
            fk_rol
        });

        // Si se solicita cambiar la contraseña
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

// ELIMINAR - Usuario permanentemente (hard delete)
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