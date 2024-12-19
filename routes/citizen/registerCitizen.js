const express = require('express');
const router = express.Router();
const { User } = require('../../models');
const { verifyRequestData, cryptWithBcrypt } = require('../../config/utils'); // Utilitaires pour validation et hachage
const ApiResponse = require('../../utils/ApiResponse'); // Classe pour les réponses API
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs

router.post('/', async (req, res) => {
  const logData = {
    message: "",
    source: "registerCitizen",
    userId: null,
    action: "Register Citizen",
    ipAddress: req.ip,
    requestData: req.body || null,
    responseData: null,
    status: "PENDING",
    deviceInfo: req.headers['user-agent'] || 'Unknown Device'
  };

  const requiredFields = ["fullName", "phoneNumber"]; // Champs obligatoires
  const verify = verifyRequestData(req.body, requiredFields);

  if (!verify.isValid) {
    logData.message = "Champs requis manquants";
    logData.status = "FAILED";
    logData.responseData = { missingFields: verify.missingFields };
    await Logger.logEvent(logData);

    return ApiResponse.badRequest(res, logData.message, logData.responseData);
  }

  try {
    const { fullName, phoneNumber } = req.body;

    // Vérification du nom complet
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length < 2) {
      logData.message = "Nom complet invalide";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, "Veuillez fournir votre nom complet (ex : 'Fulgence Medi G').");
    }

    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    // Vérifier si le numéro de téléphone est déjà utilisé
    const existingPhone = await User.findOne({ where: { phone_number: phoneNumber } });
    if (existingPhone) {
      logData.message = "Numéro de téléphone déjà utilisé";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    // Mot de passe par défaut
    const defaultPassword = "1234";
    const hashedPassword = await cryptWithBcrypt(defaultPassword);

    // Créer l'utilisateur
    const newUser = await User.create({
      email: null, // Pas d'email pour les Citizens
      password_hash: hashedPassword,
      phone_number: phoneNumber,
      email: "citizen" + phoneNumber + "@citizen.com",
      first_name: firstName,
      last_name: lastName,
      role: 'CITIZEN', // Rôle par défaut
      is_active: false // Statut inactif par défaut
    });

    const photoUrl = "uploads/others/avatar.png"

    const userPhoto = await UserPhoto.create({
      user_id: newUser.id,
      photo_url: photoUrl
    });

    logData.message = "Utilisateur enregistré avec succès";
    logData.status = "SUCCESS";
    logData.responseData = {
      id: newUser.id,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      phoneNumber: newUser.phone_number,
      role: newUser.role,
      photo_url: photoUrl,
      isActive: newUser.is_active
    };
    logData.userId = newUser.id;
    await Logger.logEvent(logData);

    return ApiResponse.created(res, logData.message, logData.responseData);
  } catch (error) {
    logData.message = "Erreur lors de l'inscription";
    logData.status = "FAILED";
    logData.responseData = { error: error.message };
    await Logger.logEvent(logData);

    return ApiResponse.serverError(res, logData.message, error.message);
  }
});

module.exports = router;
