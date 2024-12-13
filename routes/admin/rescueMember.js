const express = require('express');
const router = express.Router();
const { User, RescueMember, RescueService, UserPhoto } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse'); // Réponses standardisées
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs

// Route pour récupérer un membre de secours
router.get('/:id', authenticate(), async (req, res) => {
  const logData = {
    message: "",
    source: "getRescueMember",
    userId: req.user?.id || null,
    action: "Retrieve Rescue Member",
    ipAddress: req.ip,
    requestData: { rescueMemberId: req.params.id },
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
      logData.message = "Membre de secours introuvable";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    const photoUrl = rescueMember.user?.photos?.[0]?.photo_url || null;

    logData.message = "Membre de secours récupéré avec succès";
    logData.status = "SUCCESS";
    logData.responseData = {
      id: rescueMember.id,
      user: rescueMember.user ? {
        id: rescueMember.user.id,
        firstName: rescueMember.user.first_name,
        lastName: rescueMember.user.last_name,
        email: rescueMember.user.email,
        phoneNumber: rescueMember.user.phone_number,
        role: rescueMember.user.role,
        isActive: rescueMember.user.is_active,
        photoUrl
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
    };
    await Logger.logEvent(logData);

    return ApiResponse.success(res, logData.message, logData.responseData);
  } catch (error) {
    logData.message = "Erreur lors de la récupération du membre de secours";
    logData.status = "FAILED";
    logData.responseData = { error: error.message };
    await Logger.logEvent(logData);

    return ApiResponse.serverError(res, logData.message, error.message);
  }
});

module.exports = router;
