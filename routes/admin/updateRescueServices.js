const express = require('express');
const router = express.Router();
const { RescueService } = require('../../models');
const { verifyRequestDataForUpdate } = require('../../config/utils'); // Utilitaire pour vérifier les champs autorisés
const ApiResponse = require('../../utils/ApiResponse'); // Classe pour les réponses API
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs

// Route pour modifier un service
router.put('/:id', authenticate(), async (req, res) => {
  const logData = {
    message: "",
    source: "updateRescueService",
    userId: req.user?.id || null,
    action: "Update Rescue Service",
    ipAddress: req.ip,
    requestData: req.body || null,
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
  const allowedFields = ['name', 'service_type', 'contact_number', 'description', 'is_active'];

  // Vérification des champs autorisés pour la mise à jour
  const verify = verifyRequestDataForUpdate(req.body, allowedFields);
  if (!verify.isValid) {
    logData.message = "Certains champs ne sont pas autorisés pour la mise à jour";
    logData.status = "FAILED";
    logData.responseData = { invalidFields: verify.invalidFields };
    await Logger.logEvent(logData);

    return ApiResponse.badRequest(res, logData.message, logData.responseData);
  }

  try {
    // Rechercher le service à modifier
    const rescueService = await RescueService.findByPk(id);
    if (!rescueService) {
      logData.message = "Service de secours introuvable";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    // Mettre à jour les champs
    const updatedService = await rescueService.update(req.body);

    logData.message = "Service de secours mis à jour avec succès";
    logData.status = "SUCCESS";
    logData.responseData = {
      id: updatedService.id,
      name: updatedService.name,
      serviceType: updatedService.service_type,
      contactNumber: updatedService.contact_number,
      description: updatedService.description,
      isActive: updatedService.is_active
    };
    await Logger.logEvent(logData);

    return ApiResponse.success(res, logData.message, logData.responseData);
  } catch (error) {
    logData.message = "Erreur lors de la mise à jour du service de secours";
    logData.status = "FAILED";
    logData.responseData = { error: error.message };
    await Logger.logEvent(logData);

    return ApiResponse.serverError(res, logData.message, error.message);
  }
});

module.exports = router;
