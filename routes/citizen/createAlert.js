const express = require('express');
const router = express.Router();
const fs = require('fs'); // Gestion des fichiers
const { Alert, AlertMedia } = require('../../models');
const { verifyMultipartData } = require('../../config/utils');
const ApiResponse = require('../../utils/ApiResponse'); // Réponses standardisées
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs
const upload = require('../../config/multer');

// Configuration pour les champs de fichiers multiples
const uploadFields = upload.fields([
    { name: 'files1', maxCount: 1 },
    { name: 'files2', maxCount: 1 },
    { name: 'files3', maxCount: 1 }
]);

router.post('/', authenticate(), uploadFields, async (req, res) => {
    const logData = {
        message: "",
        source: "createAlert",
        userId: req.user?.id || null,
        action: "Create Alert",
        ipAddress: req.ip,
        requestData: req.body || null,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;

        if (user.role !== 'CITIZEN') {
            logData.message = "Accès interdit : seuls les Citoyens peuvent effectuer cette action";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.unauthorized(res, logData.message);
        }

        // Champs requis
        const requiredFields = ["location_lat", "location_lng", "description", "category"];
        const verify = verifyMultipartData(req, requiredFields);

        if (!verify.isValid) {
            logData.message = "Champs requis manquants";
            logData.status = "FAILED";
            logData.responseData = { missingFields: verify.missingFields };
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message, logData.responseData);
        }

        const { location_lat, location_lng, description, category } = req.body;

        // Vérification des catégories valides
        const validCategories = ['Accidents', 'Incendies', 'Inondations', 'Malaises', 'Noyade', 'Autre'];
        if (!validCategories.includes(category)) {
            logData.message = `La catégorie '${category}' est invalide. Les catégories valides sont : ${validCategories.join(", ")}`;
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message);
        }

        // Création de l'alerte
        const alert = await Alert.create({
            reporter_id: user.id,
            location_lat,
            location_lng,
            description,
            category,
            status: 'EN_ATTENTE' // Mise à jour pour refléter les nouveaux statuts
        });

        // Traitement des fichiers médias
        const mediaPromises = [];
        const files = req.files;

        ['files1', 'files2', 'files3'].forEach(fieldName => {
            if (files[fieldName] && files[fieldName][0]) {
                const file = files[fieldName][0];
                const isImage = file.mimetype.startsWith('image/');
                const mediaType = isImage ? 'PHOTO' : 'VIDEO';

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

        logData.message = "Nouvelle alerte créée avec succès";
        logData.status = "SUCCESS";
        logData.responseData = alertWithMedia;

        res.status(201).json({
            message: logData.message,
            data: alertWithMedia
        });

    } catch (error) {
        const files = req.files;
        if (files) {
            ['files1', 'files2', 'files3'].forEach(fieldName => {
                if (files[fieldName] && files[fieldName][0]) {
                    fs.unlinkSync(files[fieldName][0].path);
                }
            });
        }

        logData.message = "Erreur lors de la création de l'alerte";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };

        res.status(500).json({
            message: logData.message,
            data: error.message
        });
    } finally {
        // Enregistrement du log à la fin de l'exécution
        await Logger.logEvent(logData);
    }
});

module.exports = router;
