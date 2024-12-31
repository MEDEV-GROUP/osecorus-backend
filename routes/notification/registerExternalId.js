const express = require('express');
const router = express.Router();
const { User, ExternalId } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');
const { verifyRequestData } = require('../../config/utils');

router.post('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "registerExternalId",
        userId: req.user?.id || null,
        action: "Register External ID",
        ipAddress: req.ip,
        requestData: req.body,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;

        // Vérification des champs requis
        const requiredFields = ["externalId"];
        const verify = verifyRequestData(req.body, requiredFields);

        if (!verify.isValid) {
            logData.message = "Champs requis manquants";
            logData.status = "FAILED";
            logData.responseData = { missingFields: verify.missingFields };
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message, logData.responseData);
        }

        const { externalId } = req.body;

        // Vérifier si l'external ID existe déjà
        const existingExternalId = await ExternalId.findOne({
            where: { external_id: externalId }
        });

        if (existingExternalId) {
            logData.message = "Cet external ID est déjà utilisé";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message);
        }

        // Créer l'external ID
        const newExternalId = await ExternalId.create({
            user_id: user.id,
            external_id: externalId,
            phone_number: user.phone_number // Récupéré depuis l'utilisateur authentifié
        });

        logData.message = "External ID enregistré avec succès";
        logData.status = "SUCCESS";
        logData.responseData = {
            id: newExternalId.id,
            userId: newExternalId.user_id,
            externalId: newExternalId.external_id,
            phoneNumber: newExternalId.phone_number
        };
        await Logger.logEvent(logData);

        return ApiResponse.created(res, logData.message, logData.responseData);

    } catch (error) {
        logData.message = "Erreur lors de l'enregistrement de l'external ID";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;