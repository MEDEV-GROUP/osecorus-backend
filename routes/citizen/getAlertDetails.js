const express = require('express');
const router = express.Router();
const { Alert, AlertMedia, Intervention, RescueMember, User, UserPhoto } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');

router.get('/:id', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getAlertDetails",
        userId: req.user?.id || null,
        action: "Get Alert Details",
        ipAddress: req.ip,
        requestData: { alertId: req.params.id },
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;
        const { id } = req.params;

        // Vérification que l'utilisateur est un citoyen
        if (user.role !== 'CITIZEN') {
            logData.message = "Accès interdit : seuls les citoyens peuvent effectuer cette action";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.unauthorized(res, logData.message);
        }

        // Récupération de l'alerte avec toutes ses relations
        const alert = await Alert.findOne({
            where: { 
                id,
                reporter_id: user.id // S'assurer que l'alerte appartient à ce citoyen
            },
            include: [
                {
                    model: AlertMedia,
                    as: 'media',
                    attributes: ['id', 'media_type', 'media_url', 'thumbnail_url']
                },
                {
                    model: Intervention,
                    as: 'interventions',
                    include: [{
                        model: RescueMember,
                        as: 'rescueMember',
                        attributes: ['id', 'position', 'badge_number'],
                        include: [{
                            model: User,
                            as: 'user',
                            attributes: ['id', 'first_name', 'last_name', 'phone_number'],
                            include: [{
                                model: UserPhoto,
                                as: 'photos',
                                attributes: ['photo_url']
                            }]
                        }]
                    }]
                }
            ]
        });

        if (!alert) {
            logData.message = "Alerte introuvable ou accès non autorisé";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.notFound(res, logData.message);
        }

        // Formater la réponse
        const formattedResponse = {
            alert: {
                id: alert.id,
                location: {
                    lat: alert.location_lat,
                    lng: alert.location_lng
                },
                status: alert.status,
                description: alert.description,
                category: alert.category,
                address: alert.address,
                createdAt: alert.created_at,
                media: alert.media.map(media => ({
                    id: media.id,
                    type: media.media_type,
                    url: media.media_url,
                    thumbnailUrl: media.thumbnail_url
                }))
            },
            intervention: alert.interventions?.[0] ? {
                id: alert.interventions[0].id,
                status: alert.interventions[0].status,
                startTime: alert.interventions[0].start_time,
                endTime: alert.interventions[0].end_time,
                arrivalTime: alert.interventions[0].arrival_time,
                rescueMember: {
                    id: alert.interventions[0].rescueMember.id,
                    position: alert.interventions[0].rescueMember.position,
                    badgeNumber: alert.interventions[0].rescueMember.badge_number,
                    firstName: alert.interventions[0].rescueMember.user.first_name,
                    lastName: alert.interventions[0].rescueMember.user.last_name,
                    phoneNumber: alert.interventions[0].rescueMember.user.phone_number,
                    photo: alert.interventions[0].rescueMember.user.photos?.[0]?.photo_url || null
                }
            } : null
        };

        logData.message = "Détails de l'alerte récupérés avec succès";
        logData.status = "SUCCESS";
        logData.responseData = formattedResponse;
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, formattedResponse);

    } catch (error) {
        logData.message = "Erreur lors de la récupération des détails de l'alerte";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;