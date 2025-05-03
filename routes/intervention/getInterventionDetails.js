const express = require('express');
const router = express.Router();
const { Intervention, Alert, AlertMedia, User, UserPhoto, RescueMember, RescueService, Log, sequelize } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');
const { Op } = require('sequelize');

router.get('/:id', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getInterventionDetails",
        userId: req.user?.id || null,
        action: "Get Detailed Intervention Information",
        ipAddress: req.ip,
        requestData: { interventionId: req.params.id },
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;
        const { id } = req.params;

        // Vérification des autorisations
        if (user.role !== 'ADMIN' && user.role !== 'RESCUE_MEMBER') {
            logData.message = "Accès interdit : seuls les administrateurs et les membres de secours peuvent effectuer cette action";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.unauthorized(res, logData.message);
        }

        // Si c'est un membre de secours, vérifier qu'il est assigné à cette intervention
        if (user.role === 'RESCUE_MEMBER') {
            const rescueMember = await RescueMember.findOne({
                where: { user_id: user.id }
            });

            if (!rescueMember) {
                logData.message = "Profil de membre de secours non trouvé";
                logData.status = "FAILED";
                await Logger.logEvent(logData);
                return ApiResponse.unauthorized(res, logData.message);
            }

            // Vérifier si l'intervention appartient à ce membre de secours
            const memberIntervention = await Intervention.findOne({
                where: {
                    id,
                    rescue_member_id: rescueMember.id
                }
            });

            if (!memberIntervention) {
                logData.message = "Vous n'êtes pas autorisé à accéder à cette intervention";
                logData.status = "FAILED";
                await Logger.logEvent(logData);
                return ApiResponse.unauthorized(res, logData.message);
            }
        }

        // Récupérer l'intervention avec toutes ses relations
        const intervention = await Intervention.findByPk(id, {
            include: [
                {
                    model: Alert,
                    as: 'alert',
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
                                attributes: ['photo_url']
                            }]
                        }
                    ]
                },
                {
                    model: RescueMember,
                    as: 'rescueMember',
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
                }
            ]
        });

        if (!intervention) {
            logData.message = "Intervention non trouvée";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.notFound(res, logData.message);
        }

        // Récupérer l'historique des actions à partir des logs
        const actionLogs = await Log.findAll({
            where: {
                [Op.or]: [
                    {
                        action: {
                            [Op.like]: '%Intervention%'
                        },
                        request_data: {
                            interventionId: id
                        }
                    },
                    {
                        action: {
                            [Op.like]: '%Intervention%'
                        },
                        request_data: {
                            id: id
                        }
                    }
                ]
            },
            order: [['created_at', 'ASC']]
        });

        // Calculer des métriques d'intervention
        const interMetrics = {
            totalDuration: intervention.end_time ?
                Math.round((new Date(intervention.end_time) - new Date(intervention.start_time)) / (1000 * 60)) :
                null, // Durée en minutes ou null si non terminée
            responseTime: intervention.arrival_time ?
                Math.round((new Date(intervention.arrival_time) - new Date(intervention.start_time)) / (1000 * 60)) :
                null, // Temps de réponse en minutes ou null si pas encore arrivé
            daysSinceCreation: Math.round((new Date() - new Date(intervention.created_at)) / (1000 * 60 * 60 * 24))
        };

        // Créer une timeline chronologique
        const timeline = [
            {
                event: "Début de l'intervention",
                timestamp: intervention.start_time,
                description: "Intervention créée"
            }
        ];

        if (intervention.arrival_time) {
            timeline.push({
                event: "Arrivée sur place",
                timestamp: intervention.arrival_time,
                description: "L'équipe de secours est arrivée sur le lieu de l'incident"
            });
        }

        if (intervention.end_time) {
            timeline.push({
                event: "Fin de l'intervention",
                timestamp: intervention.end_time,
                description: intervention.status === 'TERMINEE' ?
                    "Intervention terminée avec succès" :
                    "Intervention annulée"
            });
        }

        // Ajouter les événements des logs à la timeline
        actionLogs.forEach(log => {
            if (log.action !== 'Get Detailed Intervention Information' &&
                log.action !== 'Get Intervention by ID') {
                timeline.push({
                    event: log.action,
                    timestamp: log.created_at,
                    description: log.message,
                    user: log.user_id,
                    status: log.status
                });
            }
        });

        // Trier la timeline par date
        timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Formater la réponse avec toutes les informations possibles
        const formattedResponse = {
            intervention: {
                id: intervention.id,
                status: intervention.status,
                startTime: intervention.start_time,
                arrivalTime: intervention.arrival_time,
                endTime: intervention.end_time,
                notes: intervention.notes,
                createdAt: intervention.created_at,
                updatedAt: intervention.updated_at,
                metrics: interMetrics
            },
            alert: {
                id: intervention.alert.id,
                category: intervention.alert.category,
                description: intervention.alert.description,
                location: {
                    lat: intervention.alert.location_lat,
                    lng: intervention.alert.location_lng
                },
                address: intervention.alert.address,
                status: intervention.alert.status,
                createdAt: intervention.alert.created_at,
                media: intervention.alert.media.map(media => ({
                    id: media.id,
                    type: media.media_type,
                    url: media.media_url,
                    thumbnailUrl: media.thumbnail_url
                })),
                reporter: intervention.alert.reporter ? {
                    id: intervention.alert.reporter.id,
                    name: `${intervention.alert.reporter.first_name} ${intervention.alert.reporter.last_name}`,
                    phoneNumber: intervention.alert.reporter.phone_number,
                    email: intervention.alert.reporter.email,
                    photo: intervention.alert.reporter.photos?.length ?
                        intervention.alert.reporter.photos[0].photo_url : null
                } : null
            },
            rescueTeam: {
                member: {
                    id: intervention.rescueMember.id,
                    position: intervention.rescueMember.position,
                    badgeNumber: intervention.rescueMember.badge_number,
                    isOnDuty: intervention.rescueMember.is_on_duty,
                    user: {
                        id: intervention.rescueMember.user.id,
                        name: `${intervention.rescueMember.user.first_name} ${intervention.rescueMember.user.last_name}`,
                        phoneNumber: intervention.rescueMember.user.phone_number,
                        email: intervention.rescueMember.user.email,
                        photo: intervention.rescueMember.user.photos?.length ?
                            intervention.rescueMember.user.photos[0].photo_url : null
                    }
                },
                service: {
                    id: intervention.rescueMember.service.id,
                    name: intervention.rescueMember.service.name,
                    type: intervention.rescueMember.service.service_type,
                    contactNumber: intervention.rescueMember.service.contact_number,
                    description: intervention.rescueMember.service.description
                }
            },
            timeline: timeline,
            actionHistory: actionLogs.map(log => ({
                action: log.action,
                timestamp: log.created_at,
                message: log.message,
                status: log.status,
                userId: log.user_id,
                requestData: log.request_data,
                responseData: log.response_data
            }))
        };

        logData.message = "Détails de l'intervention récupérés avec succès";
        logData.status = "SUCCESS";
        logData.responseData = { id: intervention.id };
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, formattedResponse);

    } catch (error) {
        logData.message = "Erreur lors de la récupération des détails de l'intervention";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;