const express = require('express');
const router = express.Router();
const { CitizenOtp, User, Token } = require('../../models');
const { verifyRequestData } = require('../../config/utils'); // Utilitaire pour valider les champs soumis
const ApiResponse = require('../../utils/ApiResponse'); // Réponses standardisées
const TokenManager = require('../../utils/TokenManager'); // Classe pour gérer les tokens

// Route pour vérifier l'OTP
router.post('/', async (req, res) => {
  const requiredFields = ['phoneNumber', 'otp'];
  const verify = verifyRequestData(req.body, requiredFields);

  if (!verify.isValid) {
    return ApiResponse.badRequest(res, "Champs requis manquants", { missingFields: verify.missingFields });
  }

  const { phoneNumber, otp } = req.body;

  try {
    // Vérifier si l'utilisateur Citizen existe avec ce numéro
    const user = await User.findOne({ where: { phone_number: phoneNumber, role: 'CITIZEN' } });

    if (!user) {
      return ApiResponse.badRequest(res, "Numéro de téléphone introuvable ou non associé à un Citizen");
    }

    // Vérifier si un OTP existe pour ce numéro
    const otpRecord = await CitizenOtp.findOne({ where: { phone_number: phoneNumber } });

    if (!otpRecord) {
      return ApiResponse.badRequest(res, "Aucun OTP trouvé pour ce numéro");
    }

    // Vérifier si l'OTP correspond
    if (otpRecord.otp !== otp) {
      return ApiResponse.badRequest(res, "Code OTP invalide");
    }

    // Vérifier si l'OTP est expiré
    if (new Date() > new Date(otpRecord.expires_at)) {
      return ApiResponse.badRequest(res, "Code OTP expiré");
    }

    // Supprimer l'OTP après utilisation
    await otpRecord.destroy();

    // Mettre à jour le statut de l'utilisateur à actif
    user.is_active = true;
    await user.save();

    // Générer un token JWT pour l'utilisateur
    const token = await TokenManager.generateToken(user);

    // Retourner les informations de l'utilisateur et le token
    return ApiResponse.success(res, "OTP vérifié avec succès", {
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
        role: user.role,
        isActive: user.is_active // Inclure le statut activé dans la réponse
      },
      token
    });

  } catch (error) {
    console.error("Erreur lors de la vérification de l'OTP:", error.message);
    return ApiResponse.serverError(res, "Erreur serveur lors de la vérification de l'OTP", error.message);
  }
});

module.exports = router;
