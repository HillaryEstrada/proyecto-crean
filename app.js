
require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();

// ========== MIDDLEWARES GLOBALES ==========
app.use(express.json());
//app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// ========== RUTAS DE AUTENTICACIÓN (PÚBLICAS) ==========
app.use('/auth', require('./routes/auth/auth.routes'));

// ========== MIDDLEWARE DE PROTECCIÓN ==========
const { verificarToken, esRutaPublica } = require('./middleware/auth.middleware');

app.use((req, res, next) => {
    if (esRutaPublica(req)) {
        return next();
    }
    verificarToken(req, res, next);
});

// ========== RUTAS PROTEGIDAS ==========

// --- MÓDULO DE AUTENTICACIÓN ---
app.use('/roles', require('./routes/auth/roles.routes'));
app.use('/users', require('./routes/auth/users.routes'));
app.use('/modulos', require('./routes/auth/modulos.routes'));
app.use('/empleados', require('./routes/auth/empleado.routes'));

// --- MÓDULO CREAN ---
app.use('/maquinaria', require('./routes/maquinaria/maquinaria.routes'));

app.use('/vehiculo', require('./routes/vehiculo/vehiculo.routes'));
app.use('/archivo', require('./routes/upload/upload.routes'));

// Rutas generales
app.use('/', require('./routes/index.routes'));

// ========== INICIAR SERVIDOR ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('════════════════════════════════════════════════');
    console.log('  Servidor iniciado en http://localhost:' + PORT);
    console.log('  Sistema de autenticación activado');
    console.log('════════════════════════════════════════════════');

});