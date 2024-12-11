const express = require('express');
const router = express.Router();
const { User, RescueMember, RescueService, UserPhoto } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse'); // Réponses standardisées
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification

// Route pour récupérer un membre de secours
router.get('/:id', authenticate(), async (req, res) => {
  const { user } = req;

  // Vérification du rôle d'administrateur
  if (user.role !== 'ADMIN') {
    return ApiResponse.unauthorized(res, "Accès interdit : seuls les administrateurs peuvent effectuer cette action");
  }

  const { id } = req.params;

  try {
    // Rechercher le RescueMember par ID avec ses relations
    const rescueMember = await RescueMember.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user', // Alias exact défini dans le modèle RescueMember
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone_number', 'role', 'is_active'],
          include: [
            {
              model: UserPhoto,
              as: 'photos', // Alias défini dans le modèle User pour les photos
              attributes: ['photo_url'], // Récupérer uniquement l'URL de la photo
            }
          ]
        },
        {
          model: RescueService,
          as: 'service', // Alias exact défini dans le modèle RescueMember
          attributes: ['id', 'name', 'service_type', 'contact_number']
        }
      ]
    });

    if (!rescueMember) {
      return ApiResponse.badRequest(res, "Membre de secours introuvable");
    }

    const photoUrl = rescueMember.user?.photos?.[0]?.photo_url || null;

    return ApiResponse.success(res, "Membre de secours récupéré avec succès", {
      id: rescueMember.id,
      user: rescueMember.user ? {
        id: rescueMember.user.id,
        firstName: rescueMember.user.first_name,
        lastName: rescueMember.user.last_name,
        email: rescueMember.user.email,
        phoneNumber: rescueMember.user.phone_number,
        role: rescueMember.user.role,
        isActive: rescueMember.user.is_active,
        photoUrl // Ajouter l'URL de la photo au résultat
      } : null,
      service: rescueMember.service ? {
        id: rescueMember.service.id,
        name: rescueMember.service.name,
        type: rescueMember.service.service_type,
        contactNumber: rescueMember.service.contact_number
      } : null,
      position: rescueMember.position,
      badgeNumber: rescueMember.badge_number,
      isOnDuty: rescueMember.is_on_duty
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du membre de secours:', error.message);
    return ApiResponse.serverError(res, "Erreur lors de la récupération du membre de secours", error.message);
  }
});

module.exports = router;
