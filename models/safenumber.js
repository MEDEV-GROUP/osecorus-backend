'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SafeNumber extends Model {
    /**
     * Définit les associations.
     */
    static associate(models) {
      // Associer SafeNumber à User (un numéro de sécurité appartient à un utilisateur)
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  SafeNumber.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    number: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^[0-9]{10,15}$/ // Validation : le numéro doit contenir entre 10 et 15 chiffres
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true // Description facultative
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'SafeNumber',
    tableName: 'SafeNumbers',
    underscored: true
  });

  return SafeNumber;
};
