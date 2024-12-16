const express = require('express');
const router = express.Router();
const { Alert, User, AlertMedia } = require('../../models');
const { authenticate } = require('../../middlewares/authenticate');
const ApiResponse = require('../../utils/ApiResponse');
const Logger = require('../../utils/Logger');

router.get('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getAllAlerts",
        userId: req.user?.id || null,
        action: "Get All Alerts",
        ipAddress: req.ip,
        requestData: req.query || null,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;

        // Vérification du rôle de l'utilisateur
        if (user.role !== 'ADMIN') {
            logData.message = "Accès interdit : seuls les administrateurs peuvent effectuer cette action";
            logData.status = "FAILED";
            await Logger.logEvent(logData);

            return ApiResponse.unauthorized(res, logData.message);
        }

        // Pagination
        const limit = parseInt(req.query.limit, 10) || 10; // Nombre maximum d'alertes par page
        const offset = parseInt(req.query.offset, 10) || 0; // Décalage pour la pagination

        // Filtrage optionnel (exemple: par catégorie ou par statut)
        const filters = {};
        if (req.query.category) {
            filters.category = req.query.category;
        }
        if (req.query.status) {
            filters.status = req.query.status;
        }

        // Récupération des alertes avec leurs relations
        const alerts = await Alert.findAndCountAll({
            where: filters,
            include: [
                {
                    model: User,
                    as: 'reporter',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                },
                {
                    model: AlertMedia,
                    as: 'media',
                    attributes: ['id', 'media_type', 'media_url']
                }
            ],
            limit,
            offset,
            order: [['created_at', 'DESC']] // Trier par date de création (la plus récente en premier)
        });

        logData.message = "Alertes récupérées avec succès";
        logData.status = "SUCCESS";
        logData.responseData = {
            total: alerts.count,
            data: alerts.rows
        };
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, {
            total: alerts.count / 2,
            data: alerts.rows
        });
    } catch (error) {
        logData.message = "Erreur lors de la récupération des alertes";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;
