const express = require('express');
const router = express.Router();
const { User, UserPhoto, Token } = require('../../models');
const { verifyRequestData, compareWithBcrypt } = require('../../config/utils');
const ApiResponse = require('../../utils/ApiResponse');
const TokenManager = require('../../utils/TokenManager');
const Logger = require('../../utils/Logger');
const { Op } = require('sequelize');

router.post('/', async (req, res) => {
    const logData = {
        message: "",
        source: "loginWithPhone",
        userId: null,
        action: "Citizen Login With Phone",
        ipAddress: req.ip,
        requestData: { phoneNumber: req.body.phoneNumber },
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    // Vérification des champs requis
    const requiredFields = ["phoneNumber", "password"];
    const verify = verifyRequestData(req.body, requiredFields);

    if (!verify.isValid) {
        logData.message = "Champs requis manquants";
        logData.status = "FAILED";
        logData.responseData = { missingFields: verify.missingFields };
        await Logger.logEvent(logData);

        return ApiResponse.badRequest(res, logData.message, logData.responseData);
    }

    try {
        const { phoneNumber, password } = req.body;

        // Rechercher l'utilisateur par numéro de téléphone
        const user = await User.findOne({
            where: {
                phone_number: phoneNumber,
                role: 'CITIZEN',
                is_active: true
            },
            include: [
                {
                    model: UserPhoto,
                    as: 'photos',
                    attributes: ['photo_url']
                }
            ]
        });

        if (!user) {
            logData.message = "Numéro de téléphone introuvable ou compte non activé";
            logData.status = "FAILED";
            await Logger.logEvent(logData);

            return ApiResponse.badRequest(res, logData.message);
        }

        logData.userId = user.id;

        // Vérifier le mot de passe
        const isPasswordValid = await compareWithBcrypt(password, user.password_hash);
        if (!isPasswordValid) {
            logData.message = "Mot de passe incorrect";
            logData.status = "FAILED";
            await Logger.logEvent(logData);

            return ApiResponse.badRequest(res, logData.message);
        }

        // Révoquer les anciens tokens actifs
        await Token.update(
            { is_revoked: true },
            {
                where: {
                    user_id: user.id,
                    is_revoked: false,
                    expires_at: { [Op.gt]: new Date() }
                }
            }
        );

        // Générer un nouveau token
        const token = await TokenManager.generateToken(user);

        // Obtenir l'URL de la première photo si disponible
        const photoUrl = user.photos?.length > 0 ? user.photos[0].photo_url : null;

        logData.message = "Connexion réussie";
        logData.status = "SUCCESS";
        logData.responseData = {
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                phoneNumber: user.phone_number,
                email: user.email,
                role: user.role,
                isActive: user.is_active,
                photoUrl
            },
            token
        };
        await Logger.logEvent(logData);

        // Réponse avec les détails de l'utilisateur et le token
        return ApiResponse.success(res, logData.message, logData.responseData);

    } catch (error) {
        logData.message = "Erreur lors de la connexion";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;