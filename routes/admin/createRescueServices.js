const express = require('express');
const router = express.Router();
const { RescueService } = require('../../models');
const { verifyRequestData } = require('../../config/utils');
const ApiResponse = require('../../utils/ApiResponse'); // Classe pour les réponses API
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs

// Middleware pour sécuriser la route et vérifier le rôle d'administrateur
router.post('/', authenticate(), async (req, res) => {
  const logData = {
    message: "",
    source: "createRescueService",
    userId: req.user?.id || null,
    action: "Create Rescue Service",
    ipAddress: req.ip,
    requestData: req.body || null,
    responseData: null,
    status: "PENDING",
    deviceInfo: req.headers['user-agent'] || 'Unknown Device'
  };

  // Vérification du rôle de l'utilisateur authentifié
  const { user } = req;
  if (user.role !== 'ADMIN') {
    logData.message = "Accès interdit : seuls les administrateurs peuvent effectuer cette action";
    logData.status = "FAILED";
    await Logger.logEvent(logData);

    return ApiResponse.unauthorized(res, logData.message);
  }

  const requiredFields = ['name', 'service_type', 'contact_number', 'description'];
  const verify = verifyRequestData(req.body, requiredFields);

  if (!verify.isValid) {
    logData.message = "Champs requis manquants";
    logData.status = "FAILED";
    logData.responseData = { missingFields: verify.missingFields };
    await Logger.logEvent(logData);

    return ApiResponse.badRequest(res, logData.message, logData.responseData);
  }

  try {
    const { name, service_type, contact_number, description } = req.body;

    // Vérifier si un service de secours avec le même nom existe déjà
    const existingService = await RescueService.findOne({ where: { name } });
    if (existingService) {
      logData.message = "Un service de secours avec ce nom existe déjà";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    // Création du service de secours
    const rescueService = await RescueService.create({
      name,
      service_type,
      contact_number,
      description,
      is_active: true
    });

    logData.message = "Service de secours créé avec succès";
    logData.status = "SUCCESS";
    logData.responseData = {
      id: rescueService.id,
      name: rescueService.name,
      serviceType: rescueService.service_type,
      contactNumber: rescueService.contact_number,
      description: rescueService.description,
      isActive: rescueService.is_active
    };
    await Logger.logEvent(logData);

    return ApiResponse.created(res, logData.message, logData.responseData);
  } catch (error) {
    logData.message = "Erreur lors de la création du service de secours";
    logData.status = "FAILED";
    logData.responseData = { error: error.message };
    await Logger.logEvent(logData);

    return ApiResponse.serverError(res, logData.message, error.message);
  }
});

module.exports = router;
