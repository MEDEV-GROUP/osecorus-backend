const express = require('express');
const router = express.Router();
const { CitizenOtp, User } = require('../../models');
const { verifyRequestData } = require('../../config/utils'); // Utilitaire pour valider les champs soumis
const ApiResponse = require('../../utils/ApiResponse'); // Réponses standardisées
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs

// Fonction utilitaire pour générer un OTP aléatoire
const generateOtp = () => Math.floor(10000 + Math.random() * 90000).toString(); // OTP à 5 chiffres

router.post('/', async (req, res) => {
  const logData = {
    message: "",
    source: "manageOTP",
    userId: null,
    action: "Manage OTP",
    ipAddress: req.ip,
    requestData: req.body,
    responseData: null,
    status: "PENDING",
    deviceInfo: req.headers['user-agent'] || 'Unknown Device'
  };

  const requiredFields = ['type', 'phoneNumber'];
  const verify = verifyRequestData(req.body, requiredFields);

  if (!verify.isValid) {
    logData.message = "Champs requis manquants";
    logData.status = "FAILED";
    await Logger.logEvent(logData);

    return ApiResponse.badRequest(res, logData.message, { missingFields: verify.missingFields });
  }

  const { type, phoneNumber } = req.body;

  try {
    // Vérification de l'utilisateur
    const user = await User.findOne({ where: { phone_number: phoneNumber, role: 'CITIZEN' } });
    if (!user) {
      logData.message = "Numéro de téléphone introuvable ou non associé à un Citoyen";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    logData.userId = user.id;

    // Récupérer ou créer l'OTP
    let otpRecord = await CitizenOtp.findOne({ where: { phone_number: phoneNumber } });
    if (type === 'create') {
      if (otpRecord) {
        logData.message = "Un OTP existe déjà pour ce numéro. Utilisez le type 'resend'.";
        logData.status = "FAILED";
        await Logger.logEvent(logData);

        return ApiResponse.badRequest(res, logData.message);
      }

      otpRecord = await CitizenOtp.create({
        phone_number: phoneNumber,
        otp: generateOtp(), // Code OTP fixe
        expires_at: new Date(Date.now() + 5 * 60 * 1000)
      });

      logData.action = "Create OTP";
      logData.message = "OTP créé avec succès";
    } else if (type === 'resend') {
      if (!otpRecord) {
        logData.message = "Aucun OTP n'existe pour ce numéro. Utilisez le type 'create'.";
        logData.status = "FAILED";
        await Logger.logEvent(logData);

        return ApiResponse.badRequest(res, logData.message);
      }

      await otpRecord.update({
        otp: generateOtp(),
        expires_at: new Date(Date.now() + 5 * 60 * 1000)
      });

      logData.action = "Resend OTP";
      logData.message = "OTP régénéré avec succès";
    } else {
      logData.message = "Type d'opération invalide. Utilisez 'create' ou 'resend'.";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    logData.status = "SUCCESS";
    logData.responseData = {
      phoneNumber: otpRecord.phone_number,
      expiresAt: otpRecord.expires_at
    };
    logData.message += ".";
    await Logger.logEvent(logData);

    return ApiResponse.success(res, logData.message, logData.responseData);
  } catch (error) {
    logData.status = "FAILED";
    logData.responseData = { error: error.message };
    logData.message = "Erreur lors de la gestion de l'OTP.";
    await Logger.logEvent(logData);

    return ApiResponse.serverError(res, logData.message, error.message);
  }
});

module.exports = router;
