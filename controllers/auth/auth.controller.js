// ============================================
// CONTROLADOR: auth.controller.js
// Descripción: Lógica de autenticación y sesiones
// ============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Auth = require('../../models/auth/auth.model');
const Modulos = require('../../models/auth/modulos.model');
const config = require('../../config/auth.config');

// LOGIN - Iniciar sesión
exports.login = async (req, res) => {
    try {
        const { credencial, password } = req.body;

        if (!credencial || !password) {
            return res.status(400).json({ 
                error: 'Usuario/Email y contraseña son requeridos' 
            });
        }

        const result = await Auth.buscarPorCredencial(credencial);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = result.rows[0];

        const passwordValido = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordValido) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // 1. Módulos base del rol
        const modulosRolResult = await Modulos.obtenerClavesPorRol(user.fk_rol);
        const modulosRol = modulosRolResult.rows.map(m => m.clave);

        // 2. Excepciones individuales del usuario
        const excepcionesResult = await Modulos.obtenerExcepcionesPorUser(user.pk_user);
        const excepciones = excepcionesResult.rows;

        // 3. Calcular módulos finales
        const modulosAgregar = excepciones
            .filter(e => e.tipo === 'agregar')
            .map(e => e.clave);

        const modulosQuitar = excepciones
            .filter(e => e.tipo === 'quitar')
            .map(e => e.clave);

        const modulos = [
            ...new Set([...modulosRol, ...modulosAgregar])
        ].filter(m => !modulosQuitar.includes(m));

        // Generar token JWT
        const token = jwt.sign(
            {
                id: user.pk_user,
                username: user.username,
                rol: user.rol_nombre,
                modulos
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        await Auth.actualizarUltimoAcceso(user.pk_user);

        const expiracion = new Date(Date.now() + config.session.maxAge);
        await Auth.guardarSesion({
            userId: user.pk_user,
            token,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'] || 'Desconocido',
            expiracion
        });

        res.json({
            mensaje: 'Login exitoso',
            token,
            user: {
                id: user.pk_user,
                username: user.username,
                rol: user.rol_nombre,
                modulos
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
    }
};

// LOGOUT
exports.logout = async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (token) await Auth.cerrarSesion(token);
        res.json({ mensaje: 'Sesión cerrada exitosamente' });
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({ error: 'Error al cerrar sesión' });
    }
};

// VERIFICAR SESIÓN
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
                rol: user.rol_nombre,
                modulos: req.user.modulos
            }
        });
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        res.status(500).json({ error: 'Error al verificar sesión' });
    }
};