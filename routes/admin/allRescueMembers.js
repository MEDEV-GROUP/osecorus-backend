const express = require('express');
const router = express.Router();
const { User, RescueMember, RescueService, UserPhoto } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse'); // Réponses standardisées
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification

// Route pour récupérer tous les membres de secours
router.get('/', authenticate(), async (req, res) => {
  const { user } = req;

  // Vérification du rôle d'administrateur
  if (user.role !== 'ADMIN') {
    return ApiResponse.unauthorized(res, "Accès interdit : seuls les administrateurs peuvent effectuer cette action");
  }

  try {
    // Rechercher tous les RescueMember avec leurs relations
    const rescueMembers = await RescueMember.findAll({
      include: [
        {
          model: User,
          as: 'user', // Alias défini dans le modèle RescueMember
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone_number', 'role', 'is_active'],
          include: [
            {
              model: UserPhoto,
              as: 'photos', // Alias défini dans le modèle User
              attributes: ['photo_url'] // Inclure uniquement l'URL de la photo
            }
          ]
        },
        {
          model: RescueService,
          as: 'service', // Alias défini dans le modèle RescueMember
          attributes: ['id', 'name', 'service_type', 'contact_number']
        }
      ]
    });

    if (rescueMembers.length === 0) {
      return ApiResponse.success(res, "Aucun membre de secours trouvé", []);
    }

    // Formater les données pour la réponse
    const formattedMembers = rescueMembers.map(member => ({
      id: member.id,
      user: member.user ? {
        id: member.user.id,
        firstName: member.user.first_name,
        lastName: member.user.last_name,
        email: member.user.email,
        phoneNumber: member.user.phone_number,
        role: member.user.role,
        isActive: member.user.is_active,
        photos: member.user.photos.map(photo => photo.photo_url) // Inclure les URLs des photos
      } : null,
      service: member.service ? {
        id: member.service.id,
        name: member.service.name,
        type: member.service.service_type,
        contactNumber: member.service.contact_number
      } : null,
      position: member.position,
      badgeNumber: member.badge_number,
      isOnDuty: member.is_on_duty
    }));

    return ApiResponse.success(res, "Liste des membres de secours récupérée avec succès", formattedMembers);
  } catch (error) {
    console.error('Erreur lors de la récupération des membres de secours:', error.message);
    return ApiResponse.serverError(res, "Erreur lors de la récupération des membres de secours", error.message);
  }
});

module.exports = router;
