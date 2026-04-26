const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crea la carpeta uploads/ si no existe (necesario en Render)
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const nombreLimpio = file.originalname
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9.\-_]/g, '_');

        cb(null, Date.now() + '-' + nombreLimpio);
    }
});

module.exports = multer({ storage });