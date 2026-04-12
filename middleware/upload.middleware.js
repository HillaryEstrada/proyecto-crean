const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const nombreLimpio = file.originalname
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // quitar acentos
            .replace(/[^a-zA-Z0-9.\-_]/g, '_'); // solo caracteres seguros

        cb(null, Date.now() + '-' + nombreLimpio);
    }
});

module.exports = multer({ storage });