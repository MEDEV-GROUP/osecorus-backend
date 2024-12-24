const express = require('express');
const router = express.Router();
const { User, RescueMember, RescueService, UserPhoto, Intervention } = require('../../models');
const { Op } = require('sequelize');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');

router.get('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getAvailableRescueMembers",
        userId: req.user?.id || null,
        action: "Retrieve Available Rescue Members",
        ipAddress: req.ip,
        requestData: null,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    const { user } = req;

    // Vérification du rôle d'administrateur
    if (user.role !== 'ADMIN') {
        logData.message = "Accès interdit : seuls les administrateurs peuvent effectuer cette action";
        logData.status = "FAILED";
        await Logger.logEvent(logData);

        return ApiResponse.unauthorized(res, logData.message);
    }

    try {
        // Trouver les IDs des RescueMembers qui sont actuellement en intervention
        const busyMemberIds = await Intervention.findAll({
            where: {
                status: {
                    [Op.notIn]: ['TERMINEE', 'ANNULEE']
                }
            },
            attributes: ['rescue_member_id']
        });

        const busyIds = busyMemberIds.map(member => member.rescue_member_id);
        console.log(busyIds);

        // Récupérer tous les RescueMembers disponibles
        const availableMembers = await RescueMember.findAll({
            where: {
                id: {
                    [Op.notIn]: busyIds
                },
                is_on_duty: true // Uniquement ceux qui sont de service
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    where: {
                        is_active: true // Uniquement les utilisateurs actifs
                    },
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone_number'],
                    include: [
                        {
                            model: UserPhoto,
                            as: 'photos',
                            attributes: ['photo_url']
                        }
                    ]
                },
                {
                    model: RescueService,
                    as: 'service',
                    where: {
                        is_active: true // Uniquement les services actifs
                    },
                    attributes: ['id', 'name', 'service_type', 'contact_number']
                }
            ]
        });

        console.log(availableMembers);

        // Formater les données pour la réponse
        const formattedMembers = availableMembers.map(member => ({
            id: member.id,
            position: member.position,
            badgeNumber: member.badge_number,
            isOnDuty: member.is_on_duty,
            user: {
                id: member.user.id,
                firstName: member.user.first_name,
                lastName: member.user.last_name,
                email: member.user.email,
                phoneNumber: member.user.phone_number,
                photo: member.user.photos?.[0]?.photo_url || null
            },
            service: {
                id: member.service.id,
                name: member.service.name,
                type: member.service.service_type,
                contactNumber: member.service.contact_number
            }
        }));

        logData.message = "Liste des membres de secours disponibles récupérée avec succès";
        logData.status = "SUCCESS";
        logData.responseData = formattedMembers;
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, formattedMembers);

    } catch (error) {
        logData.message = "Erreur lors de la récupération des membres de secours disponibles";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;