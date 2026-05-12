const express = require('express');
const router  = express.Router();
const controller = require('../../controllers/upload/archivo.controller');
const upload  = require('../../middleware/upload.middleware');
const { verificarToken } = require('../../middleware/auth.middleware');

// Requiere autenticación
router.use(verificarToken);

// Manejador de errores de multer
const handleUpload = (req, res, next) => {
    upload.single('archivo')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'El archivo supera el tamaño máximo de 10 MB' });
            }
            return res.status(400).json({ error: err.message });
        }
        next();
    });
};

router.post('/', handleUpload, controller.subirArchivo);
router.post('/temporal', handleUpload, controller.subirTemporal);

module.exports = router;