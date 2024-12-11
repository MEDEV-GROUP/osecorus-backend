const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer les dossiers s'ils n'existent pas
const uploadsDir = path.join(__dirname, '../uploads');
const picturesDir = path.join(uploadsDir, 'pictures');
const videosDir = path.join(uploadsDir, 'videos');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(picturesDir)) fs.mkdirSync(picturesDir);
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir);

// Configuration de stockage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, picturesDir);
        } else if (file.mimetype.startsWith('video/')) {
            cb(null, videosDir);
        } else {
            cb(new Error('Type de fichier non supporté'), false);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
    }
});

// Filtrage des fichiers avec validation des extensions
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'video/mp4',
        'video/mkv'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format de fichier non supporté. Seuls JPEG, PNG, GIF, MP4 et MKV sont autorisés.'), false);
    }
};

// Gestionnaire Multer avec limites
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // Limite à 10MB
        files: 3 // Maximum 3 fichiers par requête
    }
});

// Exporter le middleware
module.exports = upload;
