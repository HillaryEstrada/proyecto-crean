// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// Descripción: Verifica tokens y permisos de usuarios
// ============================================

const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');

// Verificar si el usuario está autenticado
exports.verificarToken = (req, res, next) => {
    // Obtener token de diferentes fuentes
    const token = req.headers['authorization']?.split(' ')[1] || 
                  req.cookies?.token ||
                  req.headers['x-access-token'];

    if (!token) {
        return res.status(401).json({ 
            error: 'No se proporcionó token de autenticación',
            redirect: '/views/auth/login.html'
        });
    }

    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = decoded; // Añadir info del usuario a la request
        next();
    } catch (error) {
        return res.status(401).json({ 
            error: 'Token inválido o expirado',
            redirect: '/views/auth/login.html'
        });
    }
};

// Verificar si el usuario tiene el rol requerido
exports.verificarRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({ 
                error: 'No tienes permisos para acceder a este recurso',
                rol_requerido: rolesPermitidos,
                tu_rol: req.user.rol
            });
        }

        next();
    };
};

// Middleware para verificar si una ruta es pública
exports.esRutaPublica = (req) => {
    const url = req.url.split('?')[0]; // Remover query params
    
    // Verificar rutas exactas
    if (config.publicRoutes.includes(url)) return true;
    
    // Verificar archivos estáticos (css, js, imágenes)
    if (url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|html)$/)) return true;
    
    // Verificar rutas de autenticación
    if (url.startsWith('/auth/')) return true;
    if (url.startsWith('/views/')) return true;
    
    return false;
};

// Verificar si el usuario tiene acceso a un módulo específico
exports.verificarModulo = (clave) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        const modulos = req.user.modulos || [];

        if (!modulos.includes(clave)) {
            return res.status(403).json({ 
                error: 'No tienes acceso a este módulo',
                modulo: clave
            });
        }

        next();
    };
};