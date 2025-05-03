const express = require('express');
const router = express.Router();
const { Alert, AlertMedia, User, UserPhoto, Intervention, RescueMember, RescueService } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');

router.get('/:id', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getAlertById",
        userId: req.user?.id || null,
        action: "Get Alert Details by ID",
        ipAddress: req.ip,
        requestData: { alertId: req.params.id },
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;
        const { id } = req.params;

        // Vérification que l'utilisateur est un administrateur
        if (user.role !== 'ADMIN') {
            logData.message = "Accès interdit : seuls les administrateurs peuvent effectuer cette action";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.unauthorized(res, logData.message);
        }

        // Récupération de l'alerte avec toutes ses relations
        const alert = await Alert.findOne({
            where: { id },
            include: [
                {
                    model: AlertMedia,
                    as: 'media',
                    attributes: ['id', 'media_type', 'media_url', 'thumbnail_url']
                },
                {
                    model: User,
                    as: 'reporter',
                    attributes: ['id', 'first_name', 'last_name', 'phone_number', 'email'],
                    include: [{
                        model: UserPhoto,
                        as: 'photos',
                        attributes: ['id', 'photo_url']
                    }]
                },
                {
                    model: Intervention,
                    as: 'interventions',
                    include: [{
                        model: RescueMember,
                        as: 'rescueMember',
                        attributes: ['id', 'position', 'badge_number', 'is_on_duty'],
                        include: [
                            {
                                model: User,
                                as: 'user',
                                attributes: ['id', 'first_name', 'last_name', 'phone_number', 'email'],
                                include: [{
                                    model: UserPhoto,
                                    as: 'photos',
                                    attributes: ['photo_url']
                                }]
                            },
                            {
                                model: RescueService,
                                as: 'service',
                                attributes: ['id', 'name', 'service_type', 'contact_number', 'description']
                            }
                        ]
                    }]
                }
            ]
        });

        if (!alert) {
            logData.message = "Alerte introuvable";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.notFound(res, logData.message);
        }

        // Formater la réponse avec toutes les informations possibles
        const formattedResponse = {
            alert: {
                id: alert.id,
                createdAt: alert.created_at,
                updatedAt: alert.updated_at,
                location: {
                    lat: alert.location_lat,
                    lng: alert.location_lng
                },
                address: alert.address,
                description: alert.description,
                category: alert.category,
                status: alert.status,
                media: alert.media.map(media => ({
                    id: media.id,
                    type: media.media_type,
                    url: media.media_url,
                    thumbnailUrl: media.thumbnail_url
                }))
            },
            reporter: alert.reporter ? {
                id: alert.reporter.id,
                firstName: alert.reporter.first_name,
                lastName: alert.reporter.last_name,
                phoneNumber: alert.reporter.phone_number,
                email: alert.reporter.email,
                photo: alert.reporter.photos && alert.reporter.photos.length > 0 ?
                    alert.reporter.photos[0].photo_url : null
            } : null,
            interventions: alert.interventions.map(intervention => ({
                id: intervention.id,
                startTime: intervention.start_time,
                arrivalTime: intervention.arrival_time,
                endTime: intervention.end_time,
                status: intervention.status,
                notes: intervention.notes,
                createdAt: intervention.created_at,
                updatedAt: intervention.updated_at,
                rescueMember: intervention.rescueMember ? {
                    id: intervention.rescueMember.id,
                    position: intervention.rescueMember.position,
                    badgeNumber: intervention.rescueMember.badge_number,
                    isOnDuty: intervention.rescueMember.is_on_duty,
                    user: {
                        id: intervention.rescueMember.user.id,
                        firstName: intervention.rescueMember.user.first_name,
                        lastName: intervention.rescueMember.user.last_name,
                        phoneNumber: intervention.rescueMember.user.phone_number,
                        email: intervention.rescueMember.user.email,
                        photo: intervention.rescueMember.user.photos &&
                            intervention.rescueMember.user.photos.length > 0 ?
                            intervention.rescueMember.user.photos[0].photo_url : null
                    },
                    service: {
                        id: intervention.rescueMember.service.id,
                        name: intervention.rescueMember.service.name,
                        type: intervention.rescueMember.service.service_type,
                        contactNumber: intervention.rescueMember.service.contact_number,
                        description: intervention.rescueMember.service.description
                    }
                } : null
            })),
            timeline: [
                {
                    event: "Création de l'alerte",
                    timestamp: alert.created_at
                },
                ...alert.interventions.map(intervention => [
                    {
                        event: "Début de l'intervention",
                        timestamp: intervention.start_time
                    },
                    intervention.arrival_time ? {
                        event: "Arrivée sur place",
                        timestamp: intervention.arrival_time
                    } : null,
                    intervention.end_time ? {
                        event: "Fin de l'intervention",
                        timestamp: intervention.end_time
                    } : null
                ]).flat().filter(event => event !== null)
            ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
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