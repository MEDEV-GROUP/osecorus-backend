const express = require('express');
const router = express.Router();
const { Intervention, Alert, AlertMedia, User, UserPhoto, RescueMember } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');
const { Op } = require('sequelize');

router.get('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getInterventionsHistory",
        userId: req.user?.id || null,
        action: "Get Interventions History",
        ipAddress: req.ip,
        requestData: null,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;

        // Vérification que l'utilisateur est un membre de secours
        if (user.role !== 'RESCUE_MEMBER') {
            logData.message = "Accès interdit : seuls les membres de secours peuvent effectuer cette action";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.unauthorized(res, logData.message);
        }

        // Récupération du rescue member
        const rescueMember = await RescueMember.findOne({
            where: { user_id: user.id }
        });

        if (!rescueMember) {
            logData.message = "Membre de secours non trouvé";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message);
        }

        // Récupération de toutes les interventions terminées ou annulées
        const interventions = await Intervention.findAll({
            where: {
                rescue_member_id: rescueMember.id,
                status: {
                    [Op.in]: ['TERMINEE', 'ANNULEE']
                }
            },
            include: [
                {
                    model: Alert,
                    as: 'alert',
                    include: [
                        {
                            model: AlertMedia,
                            as: 'media',
                            attributes: ['id', 'media_type', 'media_url']
                        },
                        {
                            model: User,
                            as: 'reporter',
                            attributes: ['id', 'first_name', 'last_name', 'phone_number'],
                            include: [
                                {
                                    model: UserPhoto,
                                    as: 'photos',
                                    attributes: ['photo_url']
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Formatage des données
        const formattedInterventions = interventions.map(intervention => ({
            id: intervention.id,
            startTime: intervention.start_time,
            endTime: intervention.end_time,
            arrivalTime: intervention.arrival_time,
            status: intervention.status,
            notes: intervention.notes,
            alert: intervention.alert ? {
                id: intervention.alert.id,
                location: {
                    lat: intervention.alert.location_lat,
                    lng: intervention.alert.location_lng
                },
                address: intervention.alert.address,
                category: intervention.alert.category,
                description: intervention.alert.description,
                status: intervention.alert.status,
                media: intervention.alert.media,
                reporter: intervention.alert.reporter ? {
                    id: intervention.alert.reporter.id,
                    firstName: intervention.alert.reporter.first_name,
                    lastName: intervention.alert.reporter.last_name,
                    phoneNumber: intervention.alert.reporter.phone_number,
                    photo: intervention.alert.reporter.photos?.[0]?.photo_url || null
                } : null
            } : null
        }));

        logData.message = "Historique des interventions récupéré avec succès";
        logData.status = "SUCCESS";
        logData.responseData = {
            total: interventions.length,
            interventions: formattedInterventions
        };
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, logData.responseData);

    } catch (error) {
        logData.message = "Erreur lors de la récupération de l'historique des interventions";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;