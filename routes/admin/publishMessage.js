const express = require('express');
const router = express.Router();
const { AdminMessage } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const Logger = require('../../utils/Logger');
const { authenticate } = require('../../middlewares/authenticate'); // Middleware pour vérifier l'authentification
const { verifyRequestData } = require('../../config/utils'); // Utilitaire de validation

router.post('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "publishAdminMessage",
        userId: req.user?.id || null,
        action: "Publish Message",
        ipAddress: req.ip,
        requestData: req.body,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;
        const { title, content, level } = req.body;

        // Vérification du rôle de l'utilisateur
        if (user.role !== 'ADMIN') {
            logData.message = "Accès interdit : seuls les administrateurs peuvent publier un message";
            logData.status = "FAILED";
            await Logger.logEvent(logData);

            return ApiResponse.unauthorized(res, logData.message);
        }

        // Validation des champs requis
        const requiredFields = ["title", "content", "level"];
        const verify = verifyRequestData(req.body, requiredFields);

        if (!verify.isValid) {
            logData.message = "Champs requis manquants";
            logData.status = "FAILED";
            logData.responseData = { missingFields: verify.missingFields };
            await Logger.logEvent(logData);

            return ApiResponse.badRequest(res, logData.message, logData.responseData);
        }

        // Création du message
        const message = await AdminMessage.create({
            admin_id: user.id,
            title,
            content,
            level
        });

        logData.message = "Message publié avec succès";
        logData.status = "SUCCESS";
        logData.responseData = {
            id: message.id,
            title: message.title,
            content: message.content,
            level: message.level,
            created_at: message.createdAt
        };
        await Logger.logEvent(logData);

        return ApiResponse.created(res, logData.message, logData.responseData);
    } catch (error) {
        logData.message = "Erreur lors de la publication du message";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;
