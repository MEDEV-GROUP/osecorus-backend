const express = require('express');
const router = express.Router();
const { CitizenOtp, User } = require('../../models');
const { verifyRequestData } = require('../../config/utils'); // Utilitaire pour valider les champs soumis
const ApiResponse = require('../../utils/ApiResponse'); // Réponses standardisées
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs
const SmsService = require('../../utils/SmsService'); // Service SMS Letexto

router.post('/', async (req, res) => {
  console.log('=== DÉBUT OTP REQUEST ===');
  console.log('Body reçu:', req.body);

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
  console.log('Validation des champs requis...');
  const verify = verifyRequestData(req.body, requiredFields);

  if (!verify.isValid) {
    console.log('❌ Validation échouée:', verify.missingFields);
    logData.message = "Champs requis manquants";
    logData.status = "FAILED";
    await Logger.logEvent(logData);

    return ApiResponse.badRequest(res, logData.message, { missingFields: verify.missingFields });
  }

  console.log('✅ Validation réussie');
  const { type, phoneNumber } = req.body;
  console.log(`Type: ${type}, Téléphone: ${phoneNumber}`);

  try {
    console.log('🔍 Recherche de l\'utilisateur...');
    // Vérification de l'utilisateur
    const user = await User.findOne({ where: { phone_number: phoneNumber, role: 'CITIZEN' } });
    if (!user) {
      console.log('❌ Utilisateur non trouvé pour le numéro:', phoneNumber);
      logData.message = "Numéro de téléphone introuvable ou non associé à un Citoyen";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    console.log('✅ Utilisateur trouvé:', user.id);
    logData.userId = user.id;

    console.log('🔍 Recherche OTP existant...');
    // Récupérer ou créer l'OTP
    let otpRecord = await CitizenOtp.findOne({ where: { phone_number: phoneNumber } });

    if (type === 'create') {
      console.log('📝 Type: CREATE');
      if (otpRecord) {
        console.log('❌ OTP existe déjà');
        logData.message = "Un OTP existe déjà pour ce numéro. Utilisez le type 'resend'.";
        logData.status = "FAILED";
        await Logger.logEvent(logData);

        return ApiResponse.badRequest(res, logData.message);
      }

      console.log('🔧 Génération nouveau OTP...');
      const newOtp = SmsService.generateOtp(); // 5 chiffres comme avant
      console.log('OTP généré:', newOtp);

      otpRecord = await CitizenOtp.create({
        phone_number: phoneNumber,
        otp: newOtp,
        expires_at: new Date(Date.now() + 5 * 60 * 1000)
      });
      console.log('✅ OTP créé en BDD');

      logData.action = "Create OTP";
      logData.message = "OTP créé avec succès";
    } else if (type === 'resend') {
      console.log('📤 Type: RESEND');
      if (!otpRecord) {
        console.log('❌ Aucun OTP existant trouvé');
        logData.message = "Aucun OTP n'existe pour ce numéro. Utilisez le type 'create'.";
        logData.status = "FAILED";
        await Logger.logEvent(logData);

        return ApiResponse.badRequest(res, logData.message);
      }

      console.log('🔧 Génération nouveau OTP pour resend...');
      const newOtp = SmsService.generateOtp(); // 5 chiffres comme avant
      console.log('OTP généré:', newOtp);

      await otpRecord.update({
        otp: newOtp,
        expires_at: new Date(Date.now() + 5 * 60 * 1000)
      });
      console.log('✅ OTP mis à jour en BDD');

      logData.action = "Resend OTP";
      logData.message = "OTP régénéré avec succès";
    } else {
      console.log('❌ Type invalide:', type);
      logData.message = "Type d'opération invalide. Utilisez 'create' ou 'resend'.";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    // Envoi du SMS via Letexto
    console.log('📱 Envoi SMS via Letexto...');
    console.log('Téléphone pour SMS:', phoneNumber);
    console.log('OTP à envoyer:', otpRecord.otp);

    try {
      const smsResult = await SmsService.sendOtp(phoneNumber, otpRecord.otp);
      console.log('Résultat SMS:', smsResult);

      if (smsResult.success) {
        console.log('✅ SMS envoyé avec succès');
        logData.status = "SUCCESS";
        logData.responseData = {
          phoneNumber: otpRecord.phone_number,
          expiresAt: otpRecord.expires_at
        };
        logData.message += " et SMS envoyé avec succès.";
        await Logger.logEvent(logData);

        console.log('=== FIN OTP REQUEST - SUCCÈS ===');
        return ApiResponse.success(res, logData.message, logData.responseData);
      } else {
        console.log('❌ Échec envoi SMS:', smsResult.message);
        logData.status = "FAILED";
        logData.responseData = { error: smsResult.message };
        logData.message = "Erreur lors de l'envoi du SMS.";
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, smsResult.message);
      }
    } catch (smsError) {
      console.log('💥 Exception lors envoi SMS:', smsError);
      logData.status = "FAILED";
      logData.responseData = { error: smsError.message };
      logData.message = "Erreur lors de l'envoi du SMS.";
      await Logger.logEvent(logData);

      return ApiResponse.serverError(res, logData.message, smsError.message);
    }
  } catch (error) {
    console.log('💥 ERREUR GLOBALE:', error);
    console.log('Stack trace:', error.stack);
    logData.status = "FAILED";
    logData.responseData = { error: error.message };
    logData.message = "Erreur lors de la gestion de l'OTP.";
    await Logger.logEvent(logData);

    console.log('=== FIN OTP REQUEST - ERREUR ===');
    return ApiResponse.serverError(res, logData.message, error.message);
  }
});

module.exports = router;