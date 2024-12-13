const express = require('express');
const router = express.Router();
const ApiResponse = require('../../utils/ApiResponse'); // Réponses standardisées
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs
const { Alert, AlertMedia } = require('../../models');

router.get('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getLatestAlert",
        userId: req.user?.id || null,
        action: "Retrieve Latest Alert",
        ipAddress: req.ip,
        requestData: null,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    const { user } = req;

    if (user.role !== 'CITIZEN') {
        logData.message = "Accès interdit : seuls les Citoyens peuvent effectuer cette action";
        logData.status = "FAILED";
        await Logger.logEvent(logData);
        return ApiResponse.unauthorized(res, logData.message);
    }

    try {
        const userId = user.id;

        const latestAlert = await Alert.findOne({
            where: { reporter_id: userId },
            include: [{
                model: AlertMedia,
                as: 'media',
                attributes: ['id', 'media_type', 'media_url']
            }],
            order: [['created_at', 'DESC']]
        });

        if (!latestAlert) {
            logData.message = "Aucune alerte trouvée pour cet utilisateur";
            logData.status = "SUCCESS";
            logData.responseData = null;
            await Logger.logEvent(logData);

            return res.status(200).json({
                message: logData.message,
                data: null
            });
        }

        logData.message = "Dernière alerte récupérée avec succès";
        logData.status = "SUCCESS";
        logData.responseData = latestAlert;
        await Logger.logEvent(logData);

        res.status(200).json({
            message: logData.message,
            data: latestAlert
        });

    } catch (error) {
        logData.message = "Erreur lors de la récupération de la dernière alerte";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        res.status(500).json({
            message: logData.message,
            data: error.message
        });
    }
});

module.exports = router;
