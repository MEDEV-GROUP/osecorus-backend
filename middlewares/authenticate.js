const { User, Token } = require('../models');
const TokenManager = require('../utils/TokenManager'); // Classe pour gérer les tokens
const Logger = require('../utils/Logger'); // Utilitaire pour les logs

/**
 * Middleware d'authentification pour vérifier les tokens JWT.
 *
 * @returns {Function} - Middleware Express.
 */
const authenticate = () => {
  return async (req, res, next) => {
    const logData = {
      message: "",
      source: "authenticate",
      userId: null,
      action: "Token Verification",
      ipAddress: req.ip,
      requestData: null,
      responseData: null,
      status: "PENDING",
      deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    // Récupérer le token depuis l'en-tête Authorization
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;

    if (!token) {
      logData.message = "Accès non autorisé, token manquant";
      logData.status = "FAILED";
      await Logger.logEvent(logData);
      return res.status(401).json({ error: logData.message });
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
        logData.message = "Token invalide ou révoqué";
        logData.userId = decoded.userId || null;
        logData.status = "FAILED";
        await Logger.logEvent(logData);
        return res.status(401).json({ error: logData.message });
      }

      // Vérifier si le token est expiré selon la base de données
      if (new Date(tokenRecord.expires_at) < new Date()) {
        logData.message = "Token expiré";
        logData.userId = decoded.userId || null;
        logData.status = "FAILED";
        await Logger.logEvent(logData);
        return res.status(401).json({ error: logData.message });
      }

      // Récupérer les informations de l'utilisateur
      const user = await User.findByPk(decoded.userId);

      if (!user) {
        logData.message = "Utilisateur non trouvé";
        logData.userId = decoded.userId || null;
        logData.status = "FAILED";
        await Logger.logEvent(logData);
        return res.status(401).json({ error: logData.message });
      }

      // Attacher l'utilisateur et son rôle à l'objet req
      req.user = user;
      req.role = user.role;

      // Log du succès
      logData.message = "Authentification réussie";
      logData.userId = user.id;
      logData.status = "SUCCESS";
      await Logger.logEvent(logData);

      next();
    } catch (error) {
      logData.message = "Erreur lors de la vérification du token";
      logData.responseData = { error: error.message };
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return res.status(401).json({ error: logData.message });
    }
  };
};

module.exports = { authenticate };
