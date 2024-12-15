const express = require('express');
const router = express.Router();
const { SafeNumber } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse'); // Classe pour les réponses API
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs

router.get('/', authenticate(), async (req, res) => {
  const logData = {
    message: "",
    source: "getSafeNumbers",
    userId: req.user?.id || null,
    action: "Retrieve Safe Numbers",
    ipAddress: req.ip,
    requestData: null,
    responseData: null,
    status: "PENDING",
    deviceInfo: req.headers['user-agent'] || 'Unknown Device'
  };

  const { user } = req;

  // Vérification que l'utilisateur est un citoyen
  if (user.role !== 'CITIZEN') {
    logData.message = "Accès interdit : seuls les citoyens peuvent effectuer cette action";
    logData.status = "FAILED";
    await Logger.logEvent(logData);

    return ApiResponse.unauthorized(res, logData.message);
  }

  try {
    // Récupérer les numéros safe de l'utilisateur
    const safeNumbers = await SafeNumber.findAll({
      where: { user_id: user.id },
      attributes: ['id', 'number', 'description', 'created_at'] // Récupérer uniquement les champs nécessaires
    });

    if (safeNumbers.length === 0) {
      logData.message = "Aucun numéro safe enregistré pour cet utilisateur";
      logData.status = "SUCCESS";
      logData.responseData = [];
      await Logger.logEvent(logData);

      return ApiResponse.success(res, logData.message, []);
    }

    logData.message = "Numéros safe récupérés avec succès";
    logData.status = "SUCCESS";
    logData.responseData = safeNumbers;
    await Logger.logEvent(logData);
    
    return ApiResponse.success(res, logData.message, safeNumbers);
  } catch (error) {
    logData.message = "Erreur lors de la récupération des numéros safe";
    logData.status = "FAILED";
    logData.responseData = { error: error.message };
    await Logger.logEvent(logData);

    return ApiResponse.serverError(res, logData.message, error.message);
  }
});

module.exports = router;
