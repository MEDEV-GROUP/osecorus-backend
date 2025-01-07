const express = require('express');
const router = express.Router();
const { ExternalId, User } = require('../../models');
const { verifyRequestData } = require('../../config/utils');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');
const oneSignalClient = require('../../utils/OneSignalClient');

router.post('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "sendNotificationByExternalId",
        userId: req.user?.id || null,
        action: "Send Notification",
        ipAddress: req.ip,
        requestData: req.body,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        // Vérification du rôle administrateur
        const { user } = req;
        if (user.role !== 'ADMIN') {
            logData.message = "Accès interdit : seuls les administrateurs peuvent effectuer cette action";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.unauthorized(res, logData.message);
        }

        // Vérification des champs requis
        const requiredFields = ["externalId", "message", "title"];
        const verify = verifyRequestData(req.body, requiredFields);

        if (!verify.isValid) {
            logData.message = "Champs requis manquants";
            logData.status = "FAILED";
            logData.responseData = { missingFields: verify.missingFields };
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message, logData.responseData);
        }

        const { externalId, message, title } = req.body;

        // Vérifier si l'external ID existe
        const externalIdRecord = await ExternalId.findOne({
            where: { external_id: externalId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'is_active']
            }]
        });

        if (!externalIdRecord || !externalIdRecord.user.is_active) {
            logData.message = "External ID invalide ou utilisateur inactif";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message);
        }

        // Envoyer la notification via OneSignal
        const notificationResult = await oneSignalClient.sendNotification({
            headings: title,
            contents: message,
            externalIds: [externalId],
            data: {
                senderId: user.id,
                timestamp: new Date().toISOString()
            }
        });

        if (!notificationResult.success) {
            logData.message = "Erreur lors de l'envoi de la notification";
            logData.status = "FAILED";
            logData.responseData = notificationResult.error;
            await Logger.logEvent(logData);
            return ApiResponse.serverError(res, logData.message, notificationResult.error);
        }

        logData.message = "Notification envoyée avec succès";
        logData.status = "SUCCESS";
        logData.responseData = {
            externalId,
            title,
            message,
            notificationId: notificationResult.data.id
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