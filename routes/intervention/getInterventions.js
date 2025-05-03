const express = require('express');
const router = express.Router();
const { Intervention, Alert, RescueMember, User } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');
const { Op } = require('sequelize');

router.get('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getInterventions",
        userId: req.user?.id || null,
        action: "Get All Interventions Essential Data",
        ipAddress: req.ip,
        requestData: req.query || null,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;

        // Vérification que l'utilisateur est autorisé (admin ou membre de secours)
        if (user.role !== 'ADMIN' && user.role !== 'RESCUE_MEMBER') {
            logData.message = "Accès interdit : seuls les administrateurs et membres de secours peuvent effectuer cette action";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.unauthorized(res, logData.message);
        }

        // Paramètres de pagination et filtrage
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        // Filtres optionnels
        const whereClause = {};

        // Filtre par statut si spécifié
        if (req.query.status) {
            whereClause.status = req.query.status;
        }

        // Filtre par date si spécifié
        if (req.query.startDate && req.query.endDate) {
            whereClause.created_at = {
                [Op.between]: [new Date(req.query.startDate), new Date(req.query.endDate)]
            };
        } else if (req.query.startDate) {
            whereClause.created_at = {
                [Op.gte]: new Date(req.query.startDate)
            };
        } else if (req.query.endDate) {
            whereClause.created_at = {
                [Op.lte]: new Date(req.query.endDate)
            };
        }

        // Si l'utilisateur est un membre de secours, limiter aux interventions qui lui sont assignées
        if (user.role === 'RESCUE_MEMBER') {
            const rescueMember = await RescueMember.findOne({
                where: { user_id: user.id }
            });

            if (rescueMember) {
                whereClause.rescue_member_id = rescueMember.id;
            } else {
                // Si l'utilisateur n'a pas de profil de membre de secours, retourner un tableau vide
                logData.message = "Utilisateur sans profil de membre de secours";
                logData.status = "FAILED";
                await Logger.logEvent(logData);
                return ApiResponse.success(res, "Aucune intervention trouvée", {
                    total: 0,
                    page: page,
                    limit: limit,
                    interventions: []
                });
            }
        }

        // Récupérer le nombre total d'interventions pour la pagination
        const totalInterventions = await Intervention.count({ where: whereClause });

        // Récupérer les interventions avec les relations essentielles
        const interventions = await Intervention.findAll({
            where: whereClause,
            include: [
                {
                    model: Alert,
                    as: 'alert',
                    attributes: ['id', 'category', 'location_lat', 'location_lng', 'address', 'status']
                },
                {
                    model: RescueMember,
                    as: 'rescueMember',
                    attributes: ['id', 'position', 'badge_number'],
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['id', 'first_name', 'last_name', 'phone_number']
                    }]
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        // Formater les données pour une réponse légère
        const formattedInterventions = interventions.map(intervention => ({
            id: intervention.id,
            status: intervention.status,
            startTime: intervention.start_time,
            endTime: intervention.end_time,
            arrivalTime: intervention.arrival_time,
            createdAt: intervention.created_at,
            alert: {
                id: intervention.alert.id,
                category: intervention.alert.category,
                location: {
                    lat: intervention.alert.location_lat,
                    lng: intervention.alert.location_lng
                },
                address: intervention.alert.address,
                status: intervention.alert.status
            },
            rescueMember: {
                id: intervention.rescueMember.id,
                position: intervention.rescueMember.position,
                badgeNumber: intervention.rescueMember.badge_number,
                rescuer: {
                    id: intervention.rescueMember.user.id,
                    name: `${intervention.rescueMember.user.first_name} ${intervention.rescueMember.user.last_name}`,
                    phoneNumber: intervention.rescueMember.user.phone_number
                }
            }
        }));

        // Métadonnées de pagination
        const pagination = {
            total: totalInterventions,
            page: page,
            limit: limit,
            totalPages: Math.ceil(totalInterventions / limit)
        };

        logData.message = "Interventions récupérées avec succès";
        logData.status = "SUCCESS";
        logData.responseData = {
            pagination,
            count: formattedInterventions.length,
            interventions: formattedInterventions
        };
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, {
            pagination,
            interventions: formattedInterventions
        });

    } catch (error) {
        logData.message = "Erreur lors de la récupération des interventions";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;