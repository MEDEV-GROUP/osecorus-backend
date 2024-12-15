const express = require('express');
const router = express.Router();
const { SafeNumber } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse'); // Classe pour les réponses API
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs

router.delete('/', authenticate(), async (req, res) => {
  const logData = {
    message: "",
    source: "deleteSafeNumbers",
    userId: req.user?.id || null,
    action: "Delete Safe Numbers",
    ipAddress: req.ip,
    requestData: req.body,
    responseData: null,
    status: "PENDING",
    deviceInfo: req.headers['user-agent'] || 'Unknown Device'
  };

  const { user } = req;
  const { safeNumberIds } = req.body;

  // Vérification que l'utilisateur est un citoyen
  if (user.role !== 'CITIZEN') {
    logData.message = "Accès interdit : seuls les citoyens peuvent effectuer cette action";
    logData.status = "FAILED";
    await Logger.logEvent(logData);

    return ApiResponse.unauthorized(res, logData.message);
  }

  // Vérification que des IDs sont fournis
  if (!Array.isArray(safeNumberIds) || safeNumberIds.length === 0) {
    logData.message = "Vous devez fournir une liste d'IDs de numéros safe à supprimer";
    logData.status = "FAILED";
    await Logger.logEvent(logData);

    return ApiResponse.badRequest(res, logData.message);
  }

  try {
    // Vérifier si tous les numéros appartiennent à l'utilisateur
    const userSafeNumbers = await SafeNumber.findAll({
      where: {
        id: safeNumberIds,
        user_id: user.id
      }
    });

    if (userSafeNumbers.length !== safeNumberIds.length) {
      logData.message = "Un ou plusieurs numéros ne vous appartiennent pas ou sont introuvables";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    // Supprimer les numéros
    await SafeNumber.destroy({
      where: {
        id: safeNumberIds,
        user_id: user.id
      }
    });

    logData.message = "Numéros safe supprimés avec succès";
    logData.status = "SUCCESS";
    logData.responseData = { deletedIds: safeNumberIds };
    await Logger.logEvent(logData);

    return ApiResponse.success(res, logData.message, logData.responseData);
  } catch (error) {
    logData.message = "Erreur lors de la suppression des numéros safe";
    logData.status = "FAILED";
    logData.responseData = { error: error.message };
    await Logger.logEvent(logData);

    return ApiResponse.serverError(res, logData.message, error.message);
  }
});

module.exports = router;
