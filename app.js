process.env.TZ = 'America/Mexico_City'; // <-- primera línea
require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();


// ========== MIDDLEWARES GLOBALES ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
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

// --- MÓDULO CATÁLOGOS ---
app.use('/tipo-equipo', require('./routes/tipo_equipo/tipo_equipo.routes'));
app.use('/ubicacion', require('./routes/ubicacion/ubicacion.routes'));
app.use('/factura', require('./routes/factura/factura.routes'));
app.use('/proveedor', require('./routes/proveedor/proveedor.routes'));

// --- MÓDULO CREAN ---
app.use('/maquinaria', require('./routes/maquinaria/maquinaria.routes'));
app.use('/vehiculo', require('./routes/vehiculo/vehiculo.routes'));
app.use('/archivo', require('./routes/upload/upload.routes'));

app.use('/bodega', require('./routes/bodega/bodega.routes'));
app.use('/bodega_producto', require('./routes/bodega_producto/bodega_producto.routes'));
//app.use('/productor', require('./routes/productor/productor.routes'));
app.use('/ejido', require('./routes/ejido/ejido.routes'));
// --- MÓDULO ALERTAS ---
app.use('/alertas', require('./routes/alerta/alerta.routes'));

// Rutas generales
app.use('/', require('./routes/index.routes'));

// ========== CRON DE ALERTAS ==========
const { iniciarCronAlertas } = require('./cron/alertas.cron');
iniciarCronAlertas();

// ========== INICIAR SERVIDOR ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('════════════════════════════════════════════════');
    console.log('  Servidor iniciado en http://localhost:' + PORT);
    console.log('  Sistema de autenticación activado');
    console.log('════════════════════════════════════════════════');

});