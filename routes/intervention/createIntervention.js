const express = require('express');
const router = express.Router();
const { Intervention, Alert, RescueMember, User } = require('../../models');
const { verifyRequestData } = require('../../config/utils');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');
const NotificationManager = require('../../utils/NotificationManager');
const { Op } = require('sequelize');

router.post('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "createIntervention",
        userId: req.user?.id || null,
        action: "Create Intervention",
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
        const requiredFields = ["alertId", "rescueMemberId"];
        const verify = verifyRequestData(req.body, requiredFields);

        if (!verify.isValid) {
            logData.message = "Champs requis manquants";
            logData.status = "FAILED";
            logData.responseData = { missingFields: verify.missingFields };
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message, logData.responseData);
        }

        const { alertId, rescueMemberId } = req.body;

        // Vérifier si l'alerte existe et n'a pas déjà une intervention en cours
        const alert = await Alert.findOne({
            where: {
                id: alertId,
                status: {
                    [Op.notIn]: ['RESOLUE']
                }
            }
        });

        if (!alert) {
            logData.message = "Alerte introuvable ou déjà résolue";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message);
        }

        // Vérifier si une intervention existe déjà pour cette alerte
        const existingIntervention = await Intervention.findOne({
            where: {
                alert_id: alertId,
                status: {
                    [Op.notIn]: ['TERMINEE', 'ANNULEE']
                }
            }
        });

        if (existingIntervention) {
            logData.message = "Une intervention est déjà en cours pour cette alerte";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message);
        }

        // Vérifier si le membre de secours est disponible
        const rescueMember = await RescueMember.findOne({
            where: {
                id: rescueMemberId,
                is_on_duty: true
            },
            include: [{
                model: User,
                as: 'user',
                where: { is_active: true }
            }]
        });

        if (!rescueMember) {
            logData.message = "Membre de secours introuvable ou non disponible";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message);
        }

        // Vérifier si le membre n'a pas déjà une intervention en cours
        const activeIntervention = await Intervention.findOne({
            where: {
                rescue_member_id: rescueMemberId,
                status: {
                    [Op.notIn]: ['TERMINEE', 'ANNULEE']
                }
            }
        });

        if (activeIntervention) {
            logData.message = "Le membre de secours a déjà une intervention en cours";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message);
        }

        // Créer l'intervention
        const intervention = await Intervention.create({
            alert_id: alertId,
            rescue_member_id: rescueMemberId,
            start_time: new Date(),
            status: 'EN_ROUTE'
        });

        // Mettre à jour le statut de l'alerte
        await alert.update({ status: 'ACCEPTEE' });

        // Créer une notification pour le membre de secours
        await NotificationManager.createUniqueNotification(
            user.id,
            rescueMember.user.id,
            `Nouvelle intervention assignée pour une alerte de type ${alert.category} à l'adresse ${alert.address}`
        );

        // Créer une notification pour le citoyen qui a créé l'alerte
        await NotificationManager.createUniqueNotification(
            user.id,
            alert.reporter_id,
            `Votre alerte est en cours de traitement. Une équipe de secours est en route.`
        );

        // Récupérer l'intervention avec toutes ses relations
        const fullIntervention = await Intervention.findOne({
            where: { id: intervention.id },
            include: [
                {
                    model: Alert,
                    as: 'alert',
                    attributes: ['id', 'location_lat', 'location_lng', 'category', 'description', 'status', 'address']
                },
                {
                    model: RescueMember,
                    as: 'rescueMember',
                    attributes: ['id', 'position', 'badge_number', 'is_on_duty'],
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['id', 'first_name', 'last_name', 'phone_number']
                    }]
                }
            ]
        });

        logData.message = "Intervention créée avec succès";
        logData.status = "SUCCESS";
        logData.responseData = fullIntervention;
        await Logger.logEvent(logData);

        return ApiResponse.created(res, logData.message, fullIntervention);

    } catch (error) {
        logData.message = "Erreur lors de la création de l'intervention";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;