'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CitizenOtp extends Model {
    /**
     * Définition des associations
     */
    static associate(models) {
      // Pas d'associations pour l'instant
    }
  }

  CitizenOtp.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    phone_number: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        is: /^[0-9]+$/ // Vérifie que le numéro contient uniquement des chiffres
      }
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'CitizenOtp',
    tableName: 'CitizenOtps',
    underscored: true // Utilisation de snake_case pour les noms de colonnes
  });

  return CitizenOtp;
};
