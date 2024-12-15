const express = require('express');
const router = express.Router();
const { User } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse'); // Classe pour les réponses standardisées
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs

router.patch('/', authenticate(), async (req, res) => {
  const logData = {
    message: "",
    source: "updateCitizenEmail",
    userId: req.user?.id || null,
    action: "Update Citizen Email",
    ipAddress: req.ip,
    requestData: req.body,
    responseData: null,
    status: "PENDING",
    deviceInfo: req.headers['user-agent'] || 'Unknown Device'
  };

  const { user } = req;
  const { email } = req.body;

  // Vérification que l'utilisateur est un citoyen
  if (user.role !== 'CITIZEN') {
    logData.message = "Accès interdit : seuls les citoyens peuvent effectuer cette action";
    logData.status = "FAILED";
    await Logger.logEvent(logData);

    return ApiResponse.unauthorized(res, logData.message);
  }

  // Vérification que l'email est fourni et valide
  if (!email) {
    logData.message = "L'email est obligatoire";
    logData.status = "FAILED";
    await Logger.logEvent(logData);

    return ApiResponse.badRequest(res, logData.message);
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    logData.message = "Format de l'email invalide";
    logData.status = "FAILED";
    await Logger.logEvent(logData);

    return ApiResponse.badRequest(res, logData.message);
  }

  try {
    // Vérifier si l'email est déjà utilisé
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      logData.message = "Cet email est déjà utilisé";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    // Mettre à jour l'email
    user.email = email;
    await user.save();

    logData.message = "Email mis à jour avec succès";
    logData.status = "SUCCESS";
    logData.responseData = {
      userId: user.id,
      email: user.email
    };
    await Logger.logEvent(logData);

    return ApiResponse.success(res, logData.message, logData.responseData);
  } catch (error) {
    logData.message = "Erreur lors de la mise à jour de l'email";
    logData.status = "FAILED";
    logData.responseData = { error: error.message };
    await Logger.logEvent(logData);

    return ApiResponse.serverError(res, logData.message, error.message);
  }
});

module.exports = router;
