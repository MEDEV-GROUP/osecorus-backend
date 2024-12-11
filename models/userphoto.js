'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserPhoto extends Model {
    /**
     * Définition des associations
     */
    static associate(models) {
      // Une photo appartient à un utilisateur
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user' // Alias pour les requêtes liées
      });
    }
  }

  UserPhoto.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    photo_url: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'UserPhoto',
    tableName: 'UserPhotos', // Nom explicite de la table
    underscored: true // Utilisation de snake_case dans les colonnes
  });

  return UserPhoto;
};
