// ============================================
// CONTROLADOR: auth.controller.js
// Descripción: Lógica de autenticación y sesiones
// ============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Auth = require('../../models/auth/auth.model');
const config = require('../../config/auth.config');

// LOGIN - Iniciar sesión
exports.login = async (req, res) => {
    try {
        const { credencial, password } = req.body;

        // Validar que los campos no estén vacíos
        if (!credencial || !password) {
            return res.status(400).json({ 
                error: 'Usuario/Email y contraseña son requeridos' 
            });
        }

        // Buscar usuario por username o email
        const result = await Auth.buscarPorCredencial(credencial);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ 
                error: 'Credenciales inválidas' 
            });
        }

        const user = result.rows[0];

        // Verificar la contraseña usando bcrypt
        const passwordValido = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordValido) {
            return res.status(401).json({ 
                error: 'Credenciales inválidas' 
            });
        }

        // Generar token JWT
        const token = jwt.sign(
            {
                id: user.pk_user,
                username: user.username,
                //correo: empleado.correo,
                rol: user.rol_nombre,
                //nombre: empleado.nombre
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        // Actualizar último acceso
        await Auth.actualizarUltimoAcceso(user.pk_user);

        // Guardar sesión en la base de datos
        const expiracion = new Date(Date.now() + config.session.maxAge);
        await Auth.guardarSesion({
            userId: user.pk_user,
            token,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'] || 'Desconocido',
            expiracion
        });

        // Responder con token y datos del usuario
        res.json({
            mensaje: 'Login exitoso',
            token,
            user: {
                id: user.pk_user,
                username: user.username,
                //correo: empleado.correo,
                //nombre: empleado.nombre,
                rol: user.rol_nombre
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
    }
};

// LOGOUT - Cerrar sesión
exports.logout = async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        
        if (token) {
            await Auth.cerrarSesion(token);
        }

        res.json({ mensaje: 'Sesión cerrada exitosamente' });
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({ error: 'Error al cerrar sesión' });
    }
};

// VERIFICAR - Verificar sesión actual
exports.verificarSesion = async (req, res) => {
    try {
        const result = await Auth.buscarPorId(req.user.id);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const user = result.rows[0];
        
        res.json({
            valido: true,
            user: {
                id: user.pk_user,
                username: user.username,
                //correo: empleado.correo,
                //nombre: empleado.nombre,
                rol: user.rol_nombre
            }
        });
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        res.status(500).json({ error: 'Error al verificar sesión' });
    }
};