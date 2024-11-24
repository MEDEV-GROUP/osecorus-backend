const express = require('express');
const router = express.Router();
const { User, RescueMember, RescueService } = require('../../models');

router.get('/', async (req, res) => {
    try {
        const rescueMembers = await RescueMember.findAll({
            include: [
                {
                    model: User,
                    attributes: ['id', 'email', 'first_name', 'last_name', 'phone_number', 'is_active'],
                    where: {
                        role: 'RESCUE_MEMBER'
                    }
                },
                {
                    model: RescueService,
                    attributes: ['id', 'name', 'service_type']
                }
            ]
        });

        if (rescueMembers.length === 0) {
            return res.status(200).json({
                message: "Aucun membre de secours trouvé",
                data: []
            });
        }

        // Formater les données
        const formattedMembers = rescueMembers.map(member => ({
            id: member.id,
            position: member.position,
            badgeNumber: member.badge_number,
            isOnDuty: member.is_on_duty,
            user: {
                id: member.User.id,
                email: member.User.email,
                firstName: member.User.first_name,
                lastName: member.User.last_name,
                phoneNumber: member.User.phone_number,
                isActive: member.User.is_active
            },
            service: {
                id: member.RescueService.id,
                name: member.RescueService.name,
                type: member.RescueService.service_type
            }
        }));

        res.status(200).json({
            message: "Liste des membres de secours récupérée avec succès",
            data: formattedMembers
        });

    } catch (error) {
        res.status(500).json({
            message: "Erreur lors de la récupération des membres de secours",
            data: error.message
        });
    }
});

module.exports = router;