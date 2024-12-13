const express = require('express');
const router = express.Router();
const { User, RescueMember } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse'); // Réponses standardisées
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs

// Route pour désactiver un membre de secours (soft delete)
router.patch('/:id', authenticate(), async (req, res) => {
  const logData = {
    message: "",
    source: "disableRescueMember",
    userId: req.user?.id || null,
    action: "Disable Rescue Member",
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
    // Rechercher le membre de secours
    const rescueMember = await RescueMember.findByPk(id, {
      include: {
        model: User,
        as: 'user' // Spécifiez l'alias ici
      }
    });

    if (!rescueMember) {
      logData.message = "Membre de secours introuvable";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    if (!rescueMember.user.is_active) {
      logData.message = "Ce membre est déjà désactivé";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    // Désactiver l'utilisateur associé
    await rescueMember.user.update({ is_active: false });

    logData.message = "Membre de secours désactivé avec succès";
    logData.status = "SUCCESS";
    logData.responseData = {
      id: rescueMember.id,
      user: {
        id: rescueMember.user.id,
        firstName: rescueMember.user.first_name,
        lastName: rescueMember.user.last_name,
        isActive: false
      }
    };
    await Logger.logEvent(logData);

    return ApiResponse.success(res, logData.message, logData.responseData);
  } catch (error) {
    logData.message = "Erreur lors de la désactivation du membre de secours";
    logData.status = "FAILED";
    logData.responseData = { error: error.message };
    await Logger.logEvent(logData);

    return ApiResponse.serverError(res, logData.message, error.message);
  }
});

module.exports = router;
