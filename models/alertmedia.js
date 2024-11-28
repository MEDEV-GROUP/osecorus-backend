'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AlertMedia extends Model {
    static associate(models) {
      // Définir l'association avec Alert
      this.belongsTo(models.Alert, {
        foreignKey: 'alert_id',
        as: 'alert'
      });
    }
  }

  AlertMedia.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    alert_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    media_type: {
      type: DataTypes.ENUM('PHOTO', 'VIDEO', 'AUDIO'),
      allowNull: false,
      validate: {
        isIn: [['PHOTO', 'VIDEO', 'AUDIO']] // Validation supplémentaire côté application
      }
    },
    media_url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true // Assure que c'est une URL valide
      }
    },
    thumbnail_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true // Valide uniquement si une URL est fournie
      }
    }
  }, {
    sequelize,
    modelName: 'AlertMedia',
    tableName: 'AlertMedia',
    underscored: true // Active snake_case pour les colonnes
  });

  return AlertMedia;
};
