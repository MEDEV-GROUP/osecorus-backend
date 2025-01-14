const express = require('express');
const router = express.Router();
const { Alert, AlertMedia, User, UserPhoto } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');

router.get('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getLastTwoAlerts",
        userId: req.user?.id || null,
        action: "Get Last Two Alerts",
        ipAddress: req.ip,
        requestData: null,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;

        // Vérification que l'utilisateur est un administrateur
        if (user.role !== 'ADMIN') {
            logData.message = "Accès interdit : seuls les administrateurs peuvent effectuer cette action";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.unauthorized(res, logData.message);
        }

        // Récupération des deux dernières alertes globales
        const alerts = await Alert.findAll({
            include: [
                {
                    model: AlertMedia,
                    as: 'media',
                    attributes: ['id', 'media_type', 'media_url']
                },
                {
                    model: User,
                    as: 'reporter',
                    attributes: ['id', 'first_name', 'last_name', 'phone_number', 'email'],
                    include: [
                        {
                            model: UserPhoto,
                            as: 'photos',
                            attributes: ['photo_url'],
                            limit: 1
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']],
            limit: 2
        });

        if (!alerts || alerts.length === 0) {
            logData.message = "Aucune alerte trouvée dans le système";
            logData.status = "SUCCESS";
            logData.responseData = [];
            await Logger.logEvent(logData);
            return ApiResponse.success(res, logData.message, []);
        }

        // Formater les alertes avec les informations de l'utilisateur
        const formattedAlerts = alerts.map(alert => ({
            id: alert.id,
            location_lat: alert.location_lat,
            location_lng: alert.location_lng,
            status: alert.status,
            description: alert.description,
            category: alert.category,
            address: alert.address,
            createdAt: alert.created_at,
            updatedAt: alert.updated_at,
            reporter: {
                id: alert.reporter.id,
                firstName: alert.reporter.first_name,
                lastName: alert.reporter.last_name,
                phoneNumber: alert.reporter.phone_number,
                email: alert.reporter.email,
                photo: alert.reporter.photos?.[0]?.photo_url || null
            },
            media: alert.media.map(media => ({
                id: media.id,
                media_type: media.media_type,
                media_url: media.media_url
            }))
        }));

        logData.message = "Dernières alertes récupérées avec succès";
        logData.status = "SUCCESS";
        logData.responseData = formattedAlerts;
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, formattedAlerts);

    } catch (error) {
        logData.message = "Erreur lors de la récupération des alertes";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;