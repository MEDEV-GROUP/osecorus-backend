const express = require('express');
const router = express.Router();
const { User } = require('../../models');
const { verifyRequestData, cryptWithBcrypt } = require('../../config/utils'); // Utilitaires pour validation et hachage
const ApiResponse = require('../../utils/ApiResponse'); // Classe pour les réponses API

router.post('/', async (req, res) => {
  const requiredFields = ["fullName", "phoneNumber"]; // Champs obligatoires
  const verify = verifyRequestData(req.body, requiredFields);

  if (!verify.isValid) {
    return ApiResponse.badRequest(res, "Champs requis manquants", {
      missingFields: verify.missingFields
    });
  }

  try {
    const { fullName, phoneNumber } = req.body;

    // Vérification du nom complet
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length < 2) {
      return ApiResponse.badRequest(res, "Veuillez fournir votre nom complet (ex : 'Fulgence Medi G').");
    }

    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    // Vérifier si le numéro de téléphone est déjà utilisé
    const existingPhone = await User.findOne({ where: { phone_number: phoneNumber } });
    if (existingPhone) {
      return ApiResponse.badRequest(res, "Ce numéro de téléphone est déjà utilisé");
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

    return ApiResponse.created(res, "Utilisateur enregistré avec succès", {
      id: newUser.id,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      phoneNumber: newUser.phone_number,
      role: newUser.role,
      isActive: newUser.is_active
    });
  } catch (error) {
    return ApiResponse.serverError(res, "Erreur lors de l'inscription", error.message);
  }
});

module.exports = router;
