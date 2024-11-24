const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const model = require('../models')
const { Token, Key } = require('../models');


class Utils {

  static getModel() {
    return model
  }

  static generateCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < 50; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  static isInteger(data) {
    // Vérifie si la donnée est de type 'number' et est un entier
    return typeof data === 'number' && isFinite(data) && Math.floor(data) === data;
  }

  static isEmail(data) {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(data);
  }

  static isString(data) {
    return typeof data === 'string';
  }


// Utiliser verifyRequestData
static verifyRequestData(body, requiredFields) {
  const missingFields = requiredFields.filter(field => 
      !(field in body) || 
      body[field] === undefined || 
      body[field] === ''
  );

  return {
      isValid: missingFields.length === 0,
      missingFields: missingFields.length > 0 ? missingFields : undefined
  };
}

// Utiliser verifyMultipartData
static verifyMultipartData(req, requiredFields) {
  // Vérifie req.body pour les champs texte
  const missingFields = requiredFields.filter(field => 
      !(field in req.body) || 
      req.body[field] === undefined || 
      req.body[field] === ''
  );

  // Vérifie aussi req.files pour les fichiers
  const files = req.files || {};
  
  return {
      isValid: missingFields.length === 0,
      missingFields: missingFields.length > 0 ? missingFields : undefined,
      filesInfo: files // information sur les fichiers reçus
  };
}

  static verifyRequestDataForUpdate(body, allowedFields) {
    const invalidFields = Object.keys(body).filter(field => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
      // Retourne false et la liste des champs non autorisés si des champs non désirés sont présents
      return { isValid: false, invalidFields };
    }

    // Retourne true si aucun champ non autorisé n'est présent
    return { isValid: true };
  }

  static normalizeSpaces(str) {
    return str.replace(/\s+/g, ' ');
  }

  static async cryptWithBcrypt(word) {
    const saltRounds = 10;
    try {
      const hashedPassword = await bcrypt.hash(word, saltRounds);
      return hashedPassword;
    } catch (error) {
      console.error('Erreur lors du hachage du mot de passe:', error);
      return null;
    }
  }

  static async compareWithBcrypt(word, hashWord) {
    try {
      const match = await bcrypt.compare(word, hashWord);
      return match; // Retourne true si les mots de passe correspondent, sinon false
    } catch (error) {
      console.error('Erreur lors de la vérification du mot de passe:', error);
      return false;
    }
  }

  static async generateToken_(user, userType) {
    const token = jwt.sign({ id: user.id, type: userType }, 'N5B4CEX4S6VQFBXA1N6JIO1Z2FZBUK59FYKSJGLTKO5YBFHFDJ0LXDQ52RETUVV3', { expiresIn: '90d' });
    return token;
  };

  static async generateToken(userId, userType, durationInMonths) {
    const JWT_SECRET = "N5B4CEX4S6VQFBXA1N6JIO1Z2FZBUK59FYKSJGLTKO5YBFHFDJ0LXDQ52RETUVV3"
    // Vérifier que durationInMonths est un entier entre 1 et 6
    if (
      !Number.isInteger(durationInMonths) ||
      durationInMonths < 1 ||
      durationInMonths > 6
    ) {
      throw new Error('La durée doit être un entier entre 1 et 6 mois.');
    }

    // Supprimer les tokens existants pour ce userId et userType
    await Token.destroy({
      where: {
        userId,
        userType
      }
    });

    // Calculer la durée en secondes pour JWT (approximativement 30 jours par mois)
    const secondsPerMonth = 30 * 24 * 60 * 60; // 30 jours
    const expiresInSeconds = durationInMonths * secondsPerMonth;

    // Calculer la date d'expiration
    const expireAt = new Date(Date.now() + expiresInSeconds * 1000);
    console.log(expireAt);

    // Définir la charge utile du token
    const payload = {
      userId,
      userType
    };

    // Définir les options du token
    const options = {
      expiresIn: expiresInSeconds // Validité du token en secondes
    };

    // Générer le token
    const token = jwt.sign(payload, JWT_SECRET, options);

    // Enregistrer le token dans la base de données
    await Token.create({
      token,
      userId,
      userType,
      expireAt
    });

    return token;
  }


  /**
 * Vérifie la présence et la validité d'un "hmskey" dans les en-têtes de la requête.
 *
 * @param {Object} headers - Les en-têtes de la requête HTTP.
 * @returns {Promise<Object>} - Un objet contenant le statut de validation et, si valide, les détails de la clé.
 * @throws {Error} - En cas d'erreur lors de la vérification.
 */
  static async verifyApiKey(headers) {
    const hmskey = headers['api-key'];

    if (!hmskey) {
      return { isValid: false, message: 'api-key manquant dans les en-têtes.' };
    }

    try {
      // const KeyModel = this.getModel().Key;
      const keyRecord = await Key.findOne({ where: { key: hmskey } });

      if (!keyRecord) {
        return { isValid: false, message: 'api-key invalide.' };
      }

      return { isValid: true, key: keyRecord };
    } catch (error) {
      console.error('Erreur lors de la vérification de hmskey:', error);
      return { isValid: false, message: 'Erreur serveur lors de la vérification de hmskey.' };
    }
  }

  static async verifyHmsKey(headers) {
    const hmskey = headers['hmskey'];

    if (!hmskey) {
      return { isValid: false, message: 'hmskey manquant dans les en-têtes.' };
    }

    try {
      // const KeyModel = this.getModel().Key;
      const keyRecord = await Key.findOne({ where: { key: hmskey } });

      if (!keyRecord) {
        return { isValid: false, message: 'hmskey invalide.' };
      }

      return { isValid: true, key: keyRecord };
    } catch (error) {
      console.error('Erreur lors de la vérification de hmskey:', error);
      return { isValid: false, message: 'Erreur serveur lors de la vérification de hmskey.' };
    }
  }
}

module.exports = Utils