const cloudinary = require('../../config/cloudinary/cloudinary');
const fs = require('fs');
const Conexion = require('../../config/database');

exports.subirArchivo = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No se envió archivo' });
        }
        // Detectar tipo
        const esPDF = file.mimetype === 'application/pdf';

        // Subir a cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            resource_type: esPDF ? 'raw' : 'image',
            folder: 'crean'
        });

        // Guardar en BD
        const query = `
            INSERT INTO archivo (modulo, fk_registro, tipo_archivo, categoria, url, nombre_original)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await Conexion.query(query, [
            req.body.modulo,
            req.body.fk_registro,
            esPDF ? 'pdf' : 'imagen',
            req.body.categoria,
            result.secure_url,
            file.originalname
        ]);

        // eliminar archivo local
        fs.unlinkSync(file.path);

        res.json({
            mensaje: 'Archivo subido correctamente',
            url: result.secure_url
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
    
};