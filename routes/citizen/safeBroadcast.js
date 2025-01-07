const express = require('express');
const router = express.Router();
const { SafeNumber, User, ExternalId } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');
const NotificationManager = require('../../utils/NotificationManager');
const twilio = require('twilio');

// Configuration Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

router.post('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "safeBroadcast",
        userId: req.user?.id || null,
        action: "Send Safe Message",
        ipAddress: req.ip,
        requestData: null,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;

        // Vérifier que l'utilisateur est un citoyen
        if (user.role !== 'CITIZEN') {
            logData.message = "Accès interdit : seuls les citoyens peuvent effectuer cette action";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.unauthorized(res, logData.message);
        }

        // Récupérer tous les numéros de confiance de l'utilisateur
        const safeNumbers = await SafeNumber.findAll({
            where: { user_id: user.id }
        });

        if (!safeNumbers || safeNumbers.length === 0) {
            logData.message = "Aucun numéro de confiance enregistré";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message);
        }

        // Message standard
        const safeMessage = `${user.first_name} ${user.last_name} vous informe qu'il/elle est en sécurité.`;
        
        // Pour suivre les notifications envoyées
        const notificationResults = {
            appNotifications: 0,
            smsNotifications: 0,
            errors: []
        };

        // Traiter chaque numéro
        for (const safeNumber of safeNumbers) {
            try {
                // Vérifier si le numéro appartient à un utilisateur citizen de l'application
                const citizenUser = await User.findOne({
                    where: {
                        phone_number: safeNumber.number,
                        role: 'CITIZEN',
                        is_active: true
                    },
                    include: [{
                        model: ExternalId,
                        as: 'externalIds'
                    }]
                });

                if (citizenUser && citizenUser.externalIds && citizenUser.externalIds.length > 0) {
                    // Envoyer une notification dans l'application
                    await NotificationManager.createUniqueNotification(
                        user.id,
                        citizenUser.id,
                        safeMessage,
                        "Message de sécurité"
                    );
                    notificationResults.appNotifications++;
                } else {
                    // Envoyer un SMS via Twilio
                    await client.messages.create({
                        body: safeMessage,
                        from: twilioPhoneNumber,
                        to: "+225" + safeNumber.number
                    });
                    notificationResults.smsNotifications++;
                }
            } catch (error) {
                notificationResults.errors.push({
                    number: safeNumber.number,
                    error: error.message
                });
            }
        }

        // Préparer le message de confirmation pour l'émetteur
        const confirmationMessage = `Votre message de sécurité a été envoyé avec succès à ${notificationResults.appNotifications + notificationResults.smsNotifications} contact(s) : ${notificationResults.appNotifications} notification(s) dans l'application et ${notificationResults.smsNotifications} SMS.`;
        
        // Envoyer une notification de confirmation à l'émetteur
        await NotificationManager.createUniqueNotification(
            user.id, // L'émetteur est aussi le destinataire
            user.id,
            confirmationMessage,
            "Confirmation d'envoi"
        );

        // Préparer le message de réponse
        const successMessage = `Messages envoyés avec succès : ${notificationResults.appNotifications} notification(s) dans l'application et ${notificationResults.smsNotifications} SMS`;
        
        logData.message = successMessage;
        logData.status = "SUCCESS";
        logData.responseData = {
            ...notificationResults,
            totalSent: notificationResults.appNotifications + notificationResults.smsNotifications,
            confirmationSent: true
        };
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, logData.responseData);

    } catch (error) {
        logData.message = "Erreur lors de l'envoi des messages de sécurité";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;