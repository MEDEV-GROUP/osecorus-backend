const express = require('express');
const router = express.Router();
const { Intervention, Alert, AlertMedia, User, UserPhoto, RescueMember } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');

router.get('/:id', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getInterventionById",
        userId: req.user?.id || null,
        action: "Get Intervention by ID",
        ipAddress: req.ip,
        requestData: { interventionId: req.params.id },
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;
        const { id } = req.params;

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

        // Récupération de l'intervention spécifique
        const intervention = await Intervention.findOne({
            where: { 
                id,
                rescue_member_id: rescueMember.id
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
            ]
        });

        if (!intervention) {
            logData.message = "Intervention non trouvée ou accès non autorisé";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.notFound(res, logData.message);
        }

        // Formatage de la réponse
        const formattedResponse = {
            intervention: {
                id: intervention.id,
                startTime: intervention.start_time,
                endTime: intervention.end_time,
                arrivalTime: intervention.arrival_time,
                status: intervention.status,
                notes: intervention.notes
            },
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
                reporter: {
                    id: intervention.alert.reporter.id,
                    firstName: intervention.alert.reporter.first_name,
                    lastName: intervention.alert.reporter.last_name,
                    phoneNumber: intervention.alert.reporter.phone_number,
                    photo: intervention.alert.reporter.photos?.[0]?.photo_url || null
                }
            } : null
        };

        logData.message = "Intervention récupérée avec succès";
        logData.status = "SUCCESS";
        logData.responseData = formattedResponse;
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, formattedResponse);

    } catch (error) {
        logData.message = "Erreur lors de la récupération de l'intervention";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;