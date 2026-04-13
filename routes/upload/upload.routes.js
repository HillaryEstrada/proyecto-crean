const express = require('express');
const router  = express.Router();
const controller = require('../../controllers/upload/archivo.controller');
const upload  = require('../../middleware/upload.middleware');
const { verificarToken } = require('../../middleware/auth.middleware');

// Requiere autenticación
router.use(verificarToken);

router.post('/', upload.single('archivo'), controller.subirArchivo);

module.exports = router;