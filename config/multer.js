const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer les dossiers s'ils n'existent pas
const uploadsDir = path.join(__dirname, '../uploads');
const picturesDir = path.join(uploadsDir, 'pictures');
const videosDir = path.join(uploadsDir, 'videos');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    fs.mkdirSync(picturesDir);
    fs.mkdirSync(videosDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, picturesDir);
        } else if (file.mimetype.startsWith('video/')) {
            cb(null, videosDir);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Format de fichier non supporté'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 10MB max
        files: 3 // Maximum 3 fichiers
    }
});

module.exports = upload;