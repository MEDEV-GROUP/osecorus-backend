const express = require('express');
const router = express.Router();
const { Intervention, Alert, AlertMedia, User, UserPhoto, RescueMember } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');

router.get('/latest', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getLatestIntervention",
        userId: req.user?.id || null,
        action: "Get Latest Intervention",
        ipAddress: req.ip,
        requestData: null,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;

        // Vérifier que l'utilisateur est un membre de secours
        if (user.role !== 'RESCUE_MEMBER') {
            logData.message = "Accès interdit : seuls les membres de secours peuvent effectuer cette action";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.unauthorized(res, logData.message);
        }

        // Récupérer le RescueMember associé à l'utilisateur
        const rescueMember = await RescueMember.findOne({
            where: { user_id: user.id }
        });

        if (!rescueMember) {
            logData.message = "Membre de secours non trouvé";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message);
        }

        // Récupérer la dernière intervention
        const latestIntervention = await Intervention.findOne({
            where: { rescue_member_id: rescueMember.id },
            order: [['created_at', 'DESC']],
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
            ]
        });

        if (!latestIntervention) {
            logData.message = "Aucune intervention trouvée";
            logData.status = "SUCCESS";
            logData.responseData = null;
            await Logger.logEvent(logData);
            return ApiResponse.success(res, logData.message, null);
        }

        // Formatter la réponse
        const formattedResponse = {
            intervention: {
                id: latestIntervention.id,
                startTime: latestIntervention.start_time,
                endTime: latestIntervention.end_time,
                arrivalTime: latestIntervention.arrival_time,
                status: latestIntervention.status,
                notes: latestIntervention.notes
            },
            alert: latestIntervention.alert ? {
                id: latestIntervention.alert.id,
                location: {
                    lat: latestIntervention.alert.location_lat,
                    lng: latestIntervention.alert.location_lng
                },
                address: latestIntervention.alert.address,
                category: latestIntervention.alert.category,
                description: latestIntervention.alert.description,
                status: latestIntervention.alert.status,
                media: latestIntervention.alert.media,
                reporter: {
                    id: latestIntervention.alert.reporter.id,
                    firstName: latestIntervention.alert.reporter.first_name,
                    lastName: latestIntervention.alert.reporter.last_name,
                    phoneNumber: latestIntervention.alert.reporter.phone_number,
                    photo: latestIntervention.alert.reporter.photos?.[0]?.photo_url || null
                }
            } : null
        };

        logData.message = "Dernière intervention récupérée avec succès";
        logData.status = "SUCCESS";
        logData.responseData = formattedResponse;
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, formattedResponse);

    } catch (error) {
        logData.message = "Erreur lors de la récupération de la dernière intervention";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;