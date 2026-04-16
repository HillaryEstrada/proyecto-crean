// ============================================
// CRON: alertas.cron.js
// Descripción: Evaluación automática de alertas cada 24 horas
// Uso: require('./cron/alertas.cron') en app.js
// Dependencia: npm install node-cron
// ============================================

const cron = require('node-cron');
const alertaService = require('../services/alerta/alerta.service');

// ============================================
// CRON: CADA DÍA A LAS 06:00 AM
// Formato: segundo minuto hora día mes día_semana
// '0 6 * * *' = todos los días a las 6:00 AM
// ============================================
const iniciarCronAlertas = () => {

    cron.schedule('0 9,12,15 * * *', async () => {
        console.log('============================================');
        console.log(`[CRON] ${new Date().toLocaleString('es-MX')} - Ejecutando evaluación de alertas`);
        console.log('============================================');

        try {
            await alertaService.ejecutarTodasLasAlertas();
            console.log(`[CRON] Evaluación completada: ${new Date().toLocaleString('es-MX')}`);
        } catch (error) {
            console.error('[CRON] Error en evaluación de alertas:', error.message);
        }

    }, {
        timezone: 'America/Mazatlan'
    });

    console.log('[CRON] Cron de alertas iniciado.');

    // ============================================
    // EJECUCIÓN INMEDIATA AL ARRANCAR EL SERVIDOR
    // Útil para cargar alertas desde el primer momento
    // Comenta esta sección si no lo deseas
    // ============================================
    (async () => {
        console.log('[CRON] Ejecutando evaluación inicial al arrancar...');
        try {
            await alertaService.ejecutarTodasLasAlertas();
            console.log('[CRON] Evaluación inicial completada.');
        } catch (error) {
            console.error('[CRON] Error en evaluación inicial:', error.message);
        }
    })();

};

module.exports = { iniciarCronAlertas };