const express = require('express');
const router = express.Router();
const { SafeNumber } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse'); // Classe pour les réponses API
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs
const { verifyMultipartData } = require('../../config/utils'); // Import de la fonction utilitaire

router.post('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "addSafeNumbers",
        userId: req.user?.id || null,
        action: "Add Safe Numbers",
        ipAddress: req.ip,
        requestData: req.body,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    const { user } = req;
    const { safeNumbers } = req.body;

    // Vérification du rôle de l'utilisateur
    if (user.role !== 'CITIZEN') {
        logData.message = "Accès interdit : seuls les citoyens peuvent effectuer cette action";
        logData.status = "FAILED";
        await Logger.logEvent(logData);

        return ApiResponse.unauthorized(res, logData.message);
    }

    // Vérification des champs requis
    const requiredFields = ["safeNumbers"];
    const verify = verifyMultipartData(req, requiredFields);

    if (!verify.isValid) {
        logData.message = "Champs requis manquants";
        logData.status = "FAILED";
        logData.responseData = { missingFields: verify.missingFields };
        await Logger.logEvent(logData);

        return ApiResponse.badRequest(res, logData.message, logData.responseData);
    }

    // Vérification du format de `safeNumbers`
    if (!Array.isArray(safeNumbers) || safeNumbers.length === 0) {
        logData.message = "Vous devez fournir une liste de numéros safe";
        logData.status = "FAILED";
        await Logger.logEvent(logData);

        return ApiResponse.badRequest(res, logData.message);
    }

    if (safeNumbers.length > 5) {
        logData.message = "Vous ne pouvez pas enregistrer plus de 5 numéros à la fois";
        logData.status = "FAILED";
        await Logger.logEvent(logData);

        return ApiResponse.badRequest(res, logData.message);
    }

    try {
        // Vérifier le nombre de numéros déjà enregistrés par l'utilisateur
        const existingNumbers = await SafeNumber.count({ where: { user_id: user.id } });

        if (existingNumbers + safeNumbers.length > 5) {
            logData.message = "Vous ne pouvez pas avoir plus de 5 numéros safe enregistrés";
            logData.status = "FAILED";
            await Logger.logEvent(logData);

            return ApiResponse.badRequest(res, logData.message);
        }

        // Valider et enregistrer les numéros
        const safeNumbersToCreate = safeNumbers.map(({ number, description }) => ({
            user_id: user.id,
            number,
            description: description || null
        }));

        // Créer les numéros en base de données
        const createdNumbers = await SafeNumber.bulkCreate(safeNumbersToCreate);

        logData.message = "Numéros safe enregistrés avec succès";
        logData.status = "SUCCESS";
        logData.responseData = createdNumbers;
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, createdNumbers);
    } catch (error) {
        logData.message = "Erreur lors de l'enregistrement des numéros safe";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;
