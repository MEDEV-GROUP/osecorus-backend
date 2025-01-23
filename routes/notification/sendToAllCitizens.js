const express = require('express');
const router = express.Router();
const { User } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');
const NotificationManager = require('../../utils/NotificationManager');
const { verifyRequestData } = require('../../config/utils');

router.post('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "sendToAllCitizens",
        userId: req.user?.id || null,
        action: "Send Mass Notification to Citizens",
        ipAddress: req.ip,
        requestData: req.body,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;

        // Vérifier que l'utilisateur est un administrateur
        if (user.role !== 'ADMIN') {
            logData.message = "Accès interdit : seuls les administrateurs peuvent effectuer cette action";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.unauthorized(res, logData.message);
        }

        // Vérification des champs requis
        const requiredFields = ["message", "title"];
        const verify = verifyRequestData(req.body, requiredFields);

        if (!verify.isValid) {
            logData.message = "Champs requis manquants";
            logData.status = "FAILED";
            logData.responseData = { missingFields: verify.missingFields };
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message, logData.responseData);
        }

        const { message, title } = req.body;

        // Créer une notification de masse pour tous les citoyens
        const notification = await NotificationManager.createMassNotification(
            user.id,
            'CITIZEN',
            message,
            title
        );

        logData.message = "Notification envoyée à tous les citoyens avec succès";
        logData.status = "SUCCESS";
        logData.responseData = {
            notificationId: notification.id,
            message: notification.message,
            type: notification.type,
            target: notification.target,
            createdAt: notification.created_at
        };
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, logData.responseData);

    } catch (error) {
        logData.message = "Erreur lors de l'envoi de la notification";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;