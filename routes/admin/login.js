const express = require('express');
const router = express.Router();
const { User, Token } = require('../../models');
const { verifyRequestData, compareWithBcrypt } = require('../../config/utils');
const ApiResponse = require('../../utils/ApiResponse'); // Classe pour les réponses API
const TokenManager = require('../../utils/TokenManager'); // Classe pour la gestion des tokens
const { Op } = require('sequelize'); // Opérateurs Sequelize

router.post('/', async (req, res) => {
  const requiredFields = ["email", "password"];
  const verify = verifyRequestData(req.body, requiredFields);

  if (!verify.isValid) {
    return ApiResponse.badRequest(res, "Champs requis manquants", { missingFields: verify.missingFields });
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
      return ApiResponse.badRequest(res, "Email inconnu");
    }

    // Vérifier le mot de passe
    const isPasswordValid = await compareWithBcrypt(password, admin.password_hash);
    if (!isPasswordValid) {
      return ApiResponse.badRequest(res, "Mot de passe incorrect");
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

    // Réponse avec les détails de l'utilisateur et le token
    return ApiResponse.success(res, "Connexion réussie", {
      id: admin.id,
      email: admin.email,
      firstName: admin.first_name,
      lastName: admin.last_name,
      role: admin.role,
      token
    });

  } catch (error) {
    return ApiResponse.serverError(res, "Erreur serveur", error.message);
  }
});

module.exports = router;
