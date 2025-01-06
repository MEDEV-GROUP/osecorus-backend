const express = require('express');
const router = express.Router();
const { Alert, AlertMedia } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');

router.get('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getAllCitizenAlerts",
        userId: req.user?.id || null,
        action: "Get All Citizen Alerts",
        ipAddress: req.ip,
        requestData: null,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;

        // Vérification que l'utilisateur est un citoyen
        if (user.role !== 'CITIZEN') {
            logData.message = "Accès interdit : seuls les citoyens peuvent effectuer cette action";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.unauthorized(res, logData.message);
        }

        // Récupération de toutes les alertes de l'utilisateur
        const alerts = await Alert.findAll({
            where: { reporter_id: user.id },
            include: [{
                model: AlertMedia,
                as: 'media',
                attributes: ['id', 'media_type', 'media_url']
            }],
            order: [['created_at', 'DESC']]
        });

        // Si aucune alerte n'est trouvée, renvoyer un tableau vide
        if (!alerts || alerts.length === 0) {
            logData.message = "Aucune alerte trouvée pour cet utilisateur";
            logData.status = "SUCCESS";
            logData.responseData = [];
            await Logger.logEvent(logData);
            return ApiResponse.success(res, logData.message, []);
        }

        // Formater les alertes selon le format demandé
        const formattedAlerts = alerts.map(alert => ({
            id: alert.id,
            reporter_id: alert.reporter_id,
            location_lat: alert.location_lat,
            location_lng: alert.location_lng,
            status: alert.status,
            description: alert.description,
            category: alert.category,
            address: alert.address,
            createdAt: alert.createdAt,  // Utilisation directe de createdAt de Sequelize
            updatedAt: alert.updatedAt,  // Utilisation directe de updatedAt de Sequelize
            media: alert.media.map(media => ({
                id: media.id,
                media_type: media.media_type,
                media_url: media.media_url
            }))
        }));

        logData.message = "Alertes récupérées avec succès";
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