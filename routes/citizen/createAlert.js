const express = require('express');
const router = express.Router();
const fs = require('fs');  // Ajout de cette ligne
const { Alert, AlertMedia } = require('../../models');
const { verifyMultipartData } = require('../../config/utils');
const ApiResponse = require('../../utils/ApiResponse'); // Réponses standardisées
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification
const upload = require('../../config/multer');

// Configuration pour les champs de fichiers multiples
const uploadFields = upload.fields([
    { name: 'files1', maxCount: 1 },
    { name: 'files2', maxCount: 1 },
    { name: 'files3', maxCount: 1 }
]);

router.post('/', authenticate(), uploadFields, async (req, res) => {
    const { user } = req;
    if (user.role !== 'CITIZEN') {
        return ApiResponse.unauthorized(res, "Accès interdit : seuls les Citoyens peuvent effectuer cette action");
    }

    const requiredFields = ["location_lat", "location_lng", "description"];
    const verify = verifyMultipartData(req, requiredFields);



    if (!verify.isValid) {
        return res.status(400).json({
            message: "Champs requis manquants",
            data: {
                missingFields: verify.missingFields
            }
        });
    }

    try {
        const { location_lat, location_lng, description } = req.body;

        // Création de l'alerte
        const alert = await Alert.create({
            reporter_id: req.user.id,
            location_lat,
            location_lng,
            description,
            status: 'PENDING'
        });

        // Traitement des fichiers médias
        const mediaPromises = [];
        const files = req.files;

        // Traiter chaque fichier s'il existe
        ['files1', 'files2', 'files3'].forEach(fieldName => {
            if (files[fieldName] && files[fieldName][0]) {
                const file = files[fieldName][0];
                const isImage = file.mimetype.startsWith('image/');
                const mediaType = isImage ? 'PHOTO' : 'VIDEO';

                // Construire le chemin relatif
                const relativePath = `uploads/${isImage ? 'pictures' : 'videos'}/${file.filename}`;

                mediaPromises.push(
                    AlertMedia.create({
                        alert_id: alert.id,
                        media_type: mediaType,
                        media_url: relativePath
                    })
                );
            }
        });

        if (mediaPromises.length > 0) {
            await Promise.all(mediaPromises);
        }

        // Récupérer l'alerte avec ses médias
        const alertWithMedia = await Alert.findOne({
            where: { id: alert.id },
            include: [{
                model: AlertMedia,
                as: 'media',
                attributes: ['id', 'media_type', 'media_url']
            }]
        });

        res.status(201).json({
            message: "Alerte créée avec succès",
            data: alertWithMedia
        });

    } catch (error) {
        // Supprimer les fichiers en cas d'erreur
        const files = req.files;
        if (files) {
            ['files1', 'files2', 'files3'].forEach(fieldName => {
                if (files[fieldName] && files[fieldName][0]) {
                    fs.unlinkSync(files[fieldName][0].path);
                }
            });
        }

        res.status(500).json({
            message: "Erreur lors de la création de l'alerte",
            data: error.message
        });
    }
});

module.exports = router;