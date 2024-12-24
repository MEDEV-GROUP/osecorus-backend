const express = require('express');
const router = express.Router();
const { User, RescueMember, RescueService, UserPhoto, Token } = require('../../models');
const { verifyRequestData, compareWithBcrypt } = require('../../config/utils');
const ApiResponse = require('../../utils/ApiResponse');
const TokenManager = require('../../utils/TokenManager');
const Logger = require('../../utils/Logger');
const { Op } = require('sequelize');

router.post('/', async (req, res) => {
    const logData = {
        message: "",
        source: "rescueLogin",
        userId: null,
        action: "Rescue Member Login",
        ipAddress: req.ip,
        requestData: { email: req.body.email },
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    // Vérification des champs requis
    const requiredFields = ["email", "password"];
    const verify = verifyRequestData(req.body, requiredFields);

    if (!verify.isValid) {
        logData.message = "Champs requis manquants";
        logData.status = "FAILED";
        logData.responseData = { missingFields: verify.missingFields };
        await Logger.logEvent(logData);

        return ApiResponse.badRequest(res, logData.message, logData.responseData);
    }

    try {
        const { email, password } = req.body;

        // Rechercher l'utilisateur membre de secours
        const rescueUser = await User.findOne({
            where: {
                email,
                role: 'RESCUE_MEMBER',
                is_active: true
            },
            include: [
                {
                    model: UserPhoto,
                    as: 'photos',
                    attributes: ['photo_url']
                },
                {
                    model: RescueMember,
                    as: 'rescueMember',
                    include: [
                        {
                            model: RescueService,
                            as: 'service',
                            attributes: ['id', 'name', 'service_type', 'contact_number']
                        }
                    ]
                }
            ]
        });

        if (!rescueUser) {
            logData.message = "Email inconnu ou compte non autorisé";
            logData.status = "FAILED";
            await Logger.logEvent(logData);

            return ApiResponse.badRequest(res, logData.message);
        }

        logData.userId = rescueUser.id;

        // Vérifier le mot de passe
        const isPasswordValid = await compareWithBcrypt(password, rescueUser.password_hash);
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
                    user_id: rescueUser.id,
                    is_revoked: false,
                    expires_at: { [Op.gt]: new Date() }
                }
            }
        );

        // Générer un nouveau token
        const token = await TokenManager.generateToken(rescueUser);

        const photoUrl = rescueUser.photos?.length > 0 ? rescueUser.photos[0].photo_url : null;

        logData.message = "Connexion réussie";
        logData.status = "SUCCESS";
        logData.responseData = {
            id: rescueUser.id,
            email: rescueUser.email,
            firstName: rescueUser.first_name,
            lastName: rescueUser.last_name,
            role: rescueUser.role,
            number: rescueUser.phone_number,
            token,
            photoUrl,
            rescueMember: rescueUser.rescueMember ? {
                id: rescueUser.rescueMember.id,
                position: rescueUser.rescueMember.position,
                badgeNumber: rescueUser.rescueMember.badge_number,
                isOnDuty: rescueUser.rescueMember.is_on_duty,
                service: rescueUser.rescueMember.service ? {
                    id: rescueUser.rescueMember.service.id,
                    name: rescueUser.rescueMember.service.name,
                    type: rescueUser.rescueMember.service.service_type,
                    contactNumber: rescueUser.rescueMember.service.contact_number
                } : null
            } : null
        };

        await Logger.logEvent(logData);

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