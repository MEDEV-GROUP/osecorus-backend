const express = require('express');
const router = express.Router();
const { CitizenOtp, User } = require('../../models');
const { verifyRequestData } = require('../../config/utils'); // Utilitaire pour valider les champs soumis
const ApiResponse = require('../../utils/ApiResponse'); // Réponses standardisées
const twilio = require('twilio');

// Configuration Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

// Fonction utilitaire pour générer un OTP aléatoire
const generateOtp = () => Math.floor(10000 + Math.random() * 90000).toString(); // OTP à 5 chiffres

router.post('/', async (req, res) => {
  const requiredFields = ['type', 'phoneNumber'];
  const verify = verifyRequestData(req.body, requiredFields);

  if (!verify.isValid) {
    return ApiResponse.badRequest(res, "Champs requis manquants", { missingFields: verify.missingFields });
  }

  const { type, phoneNumber } = req.body;

  try {
    // Vérifier si le numéro existe dans la table User et qu'il est lié à un Citizen
    const user = await User.findOne({ where: { phone_number: phoneNumber, role: 'CITIZEN' } });

    if (!user) {
      return ApiResponse.badRequest(res, "Numéro de téléphone introuvable ou non associé à un Citoyen");
    }

    // Vérifier si un OTP existe déjà pour ce numéro
    let otpRecord = await CitizenOtp.findOne({ where: { phone_number: phoneNumber } });

    if (type === 'create') {
      if (otpRecord) {
        return ApiResponse.badRequest(res, "Un OTP existe déjà pour ce numéro. Utilisez le type 'resend' pour régénérer.");
      }

      // Générer un nouvel OTP
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Valable pendant 5 minutes

      // Créer l'enregistrement OTP
      otpRecord = await CitizenOtp.create({
        phone_number: phoneNumber,
        otp,
        expires_at: expiresAt
      });

      // Envoyer le SMS via Twilio
      await client.messages.create({
        body: `Votre code OTP est : ${otp}. Il est valable pendant 5 minutes.`,
        from: twilioPhoneNumber,
        to: "+2250759670150"
      });

      return ApiResponse.created(res, "OTP créé et envoyé avec succès", {
        phoneNumber: otpRecord.phone_number,
        expiresAt: otpRecord.expires_at
      });

    } else if (type === 'resend') {
      if (!otpRecord) {
        return ApiResponse.badRequest(res, "Aucun OTP n'existe pour ce numéro. Utilisez le type 'create' pour en générer un.");
      }

      // Générer un nouvel OTP et mettre à jour l'enregistrement existant
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Valable pendant 5 minutes
      await otpRecord.update({ otp, expires_at: expiresAt });

      // Envoyer le SMS via Twilio
      await client.messages.create({
        body: `Votre nouveau code OTP est : ${otp}. Il est valable pendant 5 minutes.`,
        from: twilioPhoneNumber,
        to: '+2250759670150'
      });

      return ApiResponse.success(res, "OTP régénéré et envoyé avec succès", {
        phoneNumber: otpRecord.phone_number,
        expiresAt: otpRecord.expires_at
      });
    } else {
      return ApiResponse.badRequest(res, "Type d'opération invalide. Utilisez 'create' ou 'resend'.");
    }

  } catch (error) {
    console.error("Erreur lors de la gestion de l'OTP:", error.message);
    return ApiResponse.serverError(res, "Erreur serveur lors de la gestion de l'OTP", error.message);
  }
});

module.exports = router;
