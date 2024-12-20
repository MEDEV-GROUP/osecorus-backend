const express = require('express');
const router = express.Router();
const { AdminMessage, User } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const Logger = require('../../utils/Logger');
const { authenticate } = require('../../middlewares/authenticate');
const { verifyRequestData } = require('../../config/utils');
const twilio = require('twilio');

// Configuration Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

router.post('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "publishAdminMessage",
        userId: req.user?.id || null,
        action: "Publish Message and Notify",
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
        logData.responseData = {
            id: message.id,
            title: message.title,
            content: message.content,
            level: message.level,
            created_at: message.createdAt
        };

        // Récupérer tous les utilisateurs Citizen
        const citizens = await User.findAll({
            where: { role: 'CITIZEN' },
            attributes: ['phone_number']
        });

        // Envoi du SMS à chaque utilisateur
        const sendSmsPromises = citizens.map((citizen) =>
            client.messages.create({
                body: `Nouveau message de l'administrateur : ${title} - ${content}`,
                from: twilioPhoneNumber,
                to: "+225" + citizen.phone_number
            })
        );

        try {
            await Promise.all(sendSmsPromises);
            logData.message += " et notifications SMS envoyées avec succès.";
            logData.status = "SUCCESS";
        } catch (smsError) {
            logData.message += " mais erreur lors de l'envoi des notifications SMS.";
            logData.responseData.smsError = smsError.message;
            logData.status = "PARTIAL_SUCCESS";
        }

        await Logger.logEvent(logData);
        return ApiResponse.created(res, logData.message, logData.responseData);
    } catch (error) {
        logData.message = "Erreur lors de la publication du message ou des notifications.";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;
