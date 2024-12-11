const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const model = require('../models')
const { Token, Key } = require('../models');


class Utils {

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