const express = require('express');
const router = express.Router();
const { RescueService } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse'); // Classe pour les réponses API
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs

// Route pour désactiver un service
router.patch('/:id', authenticate(), async (req, res) => {
  const logData = {
    message: "",
    source: "disableRescueService",
    userId: req.user?.id || null,
    action: "Disable Rescue Service",
    ipAddress: req.ip,
    requestData: { rescueServiceId: req.params.id },
    responseData: null,
    status: "PENDING",
    deviceInfo: req.headers['user-agent'] || 'Unknown Device'
  };

  // Vérification du rôle de l'utilisateur
  const { user } = req;
  if (user.role !== 'ADMIN') {
    logData.message = "Accès interdit : seuls les administrateurs peuvent effectuer cette action";
    logData.status = "FAILED";
    await Logger.logEvent(logData);

    return ApiResponse.unauthorized(res, logData.message);
  }

  const { id } = req.params;

  try {
    // Rechercher le service par ID
    const rescueService = await RescueService.findByPk(id);

    if (!rescueService) {
      logData.message = "Service de secours introuvable";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    if (!rescueService.is_active) {
      logData.message = "Ce service est déjà désactivé";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    // Désactiver le service
    rescueService.is_active = false;
    await rescueService.save();

    logData.message = "Service de secours désactivé avec succès";
    logData.status = "SUCCESS";
    logData.responseData = {
      id: rescueService.id,
      name: rescueService.name,
      isActive: rescueService.is_active
    };
    await Logger.logEvent(logData);

    return ApiResponse.success(res, logData.message, logData.responseData);
  } catch (error) {
    logData.message = "Erreur lors de la désactivation du service de secours";
    logData.status = "FAILED";
    logData.responseData = { error: error.message };
    await Logger.logEvent(logData);

    return ApiResponse.serverError(res, logData.message, error.message);
  }
});

module.exports = router;
