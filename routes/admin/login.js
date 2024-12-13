const express = require('express');
const router = express.Router();
const { User, Token } = require('../../models');
const { verifyRequestData, compareWithBcrypt } = require('../../config/utils');
const ApiResponse = require('../../utils/ApiResponse'); // Classe pour les réponses API
const TokenManager = require('../../utils/TokenManager'); // Classe pour la gestion des tokens
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs
const { Op } = require('sequelize'); // Opérateurs Sequelize

router.post('/', async (req, res) => {
  const logData = {
    message: "",
    source: "adminLogin",
    userId: null,
    action: "Admin Login",
    ipAddress: req.ip,
    requestData: { email: req.body.email },
    responseData: null,
    status: "PENDING",
    deviceInfo: req.headers['user-agent'] || 'Unknown Device'
  };

  const requiredFields = ["email", "password"];
  const verify = verifyRequestData(req.body, requiredFields);

  if (!verify.isValid) {
    logData.message = "Champs requis manquants";
    logData.status = "FAILED";
    logData.responseData = { missingFields: verify.missingFields };
    await Logger.logEvent(logData);

    return ApiResponse.badRequest(res, logData.message, logData.responseData);
  }

  try {
    const { email, password } = req.body;

    // Rechercher l'utilisateur admin
    const admin = await User.findOne({
      where: {
        email,
        role: 'ADMIN'
      }
    });

    if (!admin) {
      logData.message = "Email inconnu";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    logData.userId = admin.id; // Mise à jour avec l'ID de l'utilisateur identifié

    // Vérifier le mot de passe
    const isPasswordValid = await compareWithBcrypt(password, admin.password_hash);
    if (!isPasswordValid) {
      logData.message = "Mot de passe incorrect";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    // Révoquer les anciens tokens actifs
    await Token.update(
      { is_revoked: true },
      {
        where: {
          user_id: admin.id,
          is_revoked: false, // Ne traiter que les tokens encore actifs
          expires_at: { [Op.gt]: new Date() } // Ne traiter que les tokens non expirés
        }
      }
    );

    // Générer un nouveau token via TokenManager
    const token = await TokenManager.generateToken(admin);

    logData.message = "Connexion réussie";
    logData.status = "SUCCESS";
    logData.responseData = {
      id: admin.id,
      email: admin.email,
      firstName: admin.first_name,
      lastName: admin.last_name,
      role: admin.role,
      token
    };
    await Logger.logEvent(logData);

    // Réponse avec les détails de l'utilisateur et le token
    return ApiResponse.success(res, logData.message, logData.responseData);

  } catch (error) {
    logData.message = "Erreur serveur";
    logData.status = "FAILED";
    logData.responseData = { error: error.message };
    await Logger.logEvent(logData);

    return ApiResponse.serverError(res, logData.message, error.message);
  }
});

module.exports = router;
