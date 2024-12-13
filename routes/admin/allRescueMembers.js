const express = require('express');
const router = express.Router();
const { User, RescueMember, RescueService, UserPhoto } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse'); // Réponses standardisées
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs

// Route pour récupérer tous les membres de secours
router.get('/', authenticate(), async (req, res) => {
  const logData = {
    message: "",
    source: "getRescueMembers",
    userId: req.user?.id || null,
    action: "Retrieve Rescue Members",
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
      logData.message = "Aucun membre de secours trouvé";
      logData.status = "SUCCESS";
      logData.responseData = [];
      await Logger.logEvent(logData);

      return ApiResponse.success(res, logData.message, []);
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

    logData.message = "Liste des membres de secours récupérée avec succès";
    logData.status = "SUCCESS";
    logData.responseData = formattedMembers;
    await Logger.logEvent(logData);

    return ApiResponse.success(res, logData.message, formattedMembers);
  } catch (error) {
    logData.message = "Erreur lors de la récupération des membres de secours";
    logData.status = "FAILED";
    logData.responseData = { error: error.message };
    await Logger.logEvent(logData);

    return ApiResponse.serverError(res, logData.message, error.message);
  }
});

module.exports = router;
