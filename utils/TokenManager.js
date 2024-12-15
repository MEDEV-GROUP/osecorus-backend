const jwt = require('jsonwebtoken');
const { Token } = require('../models'); // Modèle Token Sequelize
const JWT_SECRET = process.env.JWT_SECRET_DEV || 'your_default_jwt_secret'; // Clé secrète pour JWT
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'; // Durée de validité du token

class TokenManager {
  /**
   * Génère un token pour un utilisateur donné.
   * @param {Object} user - L'utilisateur (objet Sequelize).
   * @param {string} user.role - Le rôle de l'utilisateur (CITIZEN, RESCUE_MEMBER, ADMIN).
   * @returns {string} - Le token JWT généré.
   */
  static async generateToken(user) {
    const payload = {
      userId: user.id,
      role: user.role
    };

    // Déterminer la durée d'expiration du token
    const expiresIn = user.role === 'CITIZEN' ? '1y' : JWT_EXPIRES_IN;
    const expirationMilliseconds = user.role === 'CITIZEN'
      ? 365 * 24 * 60 * 60 * 1000 // 1 an en millisecondes
      : this._getExpirationMilliseconds(JWT_EXPIRES_IN);

    // Générer le token JWT
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn });

    // Enregistrer le token dans la base de données
    await Token.create({
      user_id: user.id,
      token,
      type: 'ACCESS', // Vous pouvez gérer différents types de tokens ici (par ex. ACCESS, REFRESH)
      is_revoked: false,
      expires_at: new Date(Date.now() + expirationMilliseconds)
    });

    return token;
  }


  /**
   * Vérifie un token JWT.
   * @param {string} token - Le token JWT à vérifier.
   * @returns {Object|null} - Le payload décodé si valide, sinon null.
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      console.error('Erreur de vérification du token:', error.message);
      return null;
    }
  }

  /**
   * Révoque un token pour un utilisateur.
   * @param {string} token - Le token à révoquer.
   * @returns {boolean} - True si le token a été révoqué, sinon false.
   */
  static async revokeToken(token) {
    try {
      const tokenRecord = await Token.findOne({ where: { token } });
      if (!tokenRecord) return false;

      tokenRecord.is_revoked = true;
      await tokenRecord.save();
      return true;
    } catch (error) {
      console.error('Erreur lors de la révocation du token:', error.message);
      return false;
    }
  }

  /**
   * Récupère les millisecondes pour la durée de validité d'un token.
   * @param {string} expiresIn - Durée de validité du token (par ex. "24h").
   * @returns {number} - Millisecondes correspondant à la durée.
   * @private
   */
  static _getExpirationMilliseconds(expiresIn) {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 0;

    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's': return value * 1000; // secondes
      case 'm': return value * 60 * 1000; // minutes
      case 'h': return value * 60 * 60 * 1000; // heures
      case 'd': return value * 24 * 60 * 60 * 1000; // jours
      default: return 0;
    }
  }
}

module.exports = TokenManager;
