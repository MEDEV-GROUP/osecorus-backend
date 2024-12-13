const express = require('express');
const router = express.Router();
const { CitizenOtp, User } = require('../../models');
const { verifyRequestData } = require('../../config/utils'); // Utilitaire pour valider les champs soumis
const ApiResponse = require('../../utils/ApiResponse'); // Réponses standardisées
const TokenManager = require('../../utils/TokenManager'); // Classe pour gérer les tokens
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs

// Route pour vérifier l'OTP
router.post('/', async (req, res) => {
  const logData = {
    message: "",
    source: "verifyOtp",
    userId: null,
    action: "Verify OTP",
    ipAddress: req.ip,
    requestData: req.body || null,
    responseData: null,
    status: "PENDING",
    deviceInfo: req.headers['user-agent'] || 'Unknown Device'
  };

  const requiredFields = ['phoneNumber', 'otp'];
  const verify = verifyRequestData(req.body, requiredFields);

  if (!verify.isValid) {
    logData.message = "Champs requis manquants";
    logData.status = "FAILED";
    logData.responseData = { missingFields: verify.missingFields };
    await Logger.logEvent(logData);

    return ApiResponse.badRequest(res, logData.message, logData.responseData);
  }

  const { phoneNumber, otp } = req.body;

  try {
    // Vérifier si l'utilisateur Citizen existe avec ce numéro
    const user = await User.findOne({ where: { phone_number: phoneNumber, role: 'CITIZEN' } });

    if (!user) {
      logData.message = "Numéro de téléphone introuvable ou non associé à un Citizen";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    logData.userId = user.id; // Mise à jour de l'utilisateur identifié

    // Vérifier si un OTP existe pour ce numéro
    const otpRecord = await CitizenOtp.findOne({ where: { phone_number: phoneNumber } });

    if (!otpRecord) {
      logData.message = "Aucun OTP trouvé pour ce numéro";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    // Vérifier si l'OTP correspond
    if (otpRecord.otp !== otp) {
      logData.message = "Code OTP invalide";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    // Vérifier si l'OTP est expiré
    if (new Date() > new Date(otpRecord.expires_at)) {
      logData.message = "Code OTP expiré";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    // Supprimer l'OTP après utilisation
    await otpRecord.destroy();

    // Mettre à jour le statut de l'utilisateur à actif
    user.is_active = true;
    await user.save();

    // Générer un token JWT pour l'utilisateur
    const token = await TokenManager.generateToken(user);

    // Log du succès
    logData.message = "OTP vérifié avec succès";
    logData.status = "SUCCESS";
    logData.responseData = {
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
        role: user.role,
        isActive: user.is_active
      },
      token
    };
    await Logger.logEvent(logData);

    // Retourner les informations de l'utilisateur et le token
    return ApiResponse.success(res, logData.message, logData.responseData);

  } catch (error) {
    logData.message = "Erreur serveur lors de la vérification de l'OTP";
    logData.status = "FAILED";
    logData.responseData = { error: error.message };
    await Logger.logEvent(logData);

    return ApiResponse.serverError(res, logData.message, error.message);
  }
});

module.exports = router;
