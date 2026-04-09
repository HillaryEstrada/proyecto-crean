require('dotenv').config();

module.exports = {
    // Configuración de JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'clave_por_defecto_cambiar_en_produccion',
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    },

    // Configuración de bcrypt
    bcrypt: {
        saltRounds: 10
    },

    // Configuración de sesión
    session: {
        maxAge: 8 * 60 * 60 * 1000 // 8 horas en milisegundos
    },

    // Rutas públicas (no requieren autenticación)
    publicRoutes: [
        '/auth/login',
        '/views/auth/login.html',
        '/',
        '/index.html'
    ]
};