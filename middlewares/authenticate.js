// middleware/authenticate.js

const { User, Token } = require('../models');
const TokenManager = require('../utils/TokenManager'); // Classe pour gérer les tokens


/**
 * Middleware d'authentification pour vérifier les tokens JWT.
 *
 * @returns {Function} - Middleware Express.
 */
const authenticate = () => {
  return async (req, res, next) => {
    // Récupérer le token depuis l'en-tête Authorization
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;

    if (!token) {
      return res.status(401).json({ error: 'Accès non autorisé, token manquant' });
    }

    try {
      // Vérifier et décoder le token JWT
      const decoded = TokenManager.verifyToken(token);

      // Vérifier le token dans la table Tokens
      const tokenRecord = await Token.findOne({
        where: {
          token,
          user_id: decoded.userId,
          is_revoked: false
        }
      });

      if (!tokenRecord) {
        return res.status(401).json({ error: 'Token invalide ou révoqué' });
      }

      // Vérifier si le token est expiré selon la base de données
      if (new Date(tokenRecord.expires_at) < new Date()) {
        return res.status(401).json({ error: 'Token expiré' });
      }

      // Récupérer les informations de l'utilisateur
      const user = await User.findByPk(decoded.userId);

      if (!user) {
        return res.status(401).json({ error: 'Utilisateur non trouvé' });
      }

      // Attacher l'utilisateur et son rôle à l'objet req
      req.user = user;
      req.role = user.role; // Récupérer le rôle de l'utilisateur (CITIZEN, RESCUE_MEMBER, ADMIN)
      next();
    } catch (error) {
      // Gestion des erreurs de vérification du token (par exemple, token expiré ou invalide)
      return res.status(401).json({ error: 'Accès non autorisé, token invalide' });
    }
  };
};

module.exports = { authenticate };
