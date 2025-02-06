'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Alert extends Model {
    static associate(models) {
      // Définition des relations
      this.hasMany(models.AlertMedia, {
        foreignKey: 'alert_id',
        as: 'media'
      });

      this.belongsTo(models.User, {
        foreignKey: 'reporter_id',
        as: 'reporter'
      });
      // Ajouter cette nouvelle association
      this.hasMany(models.Intervention, {
        foreignKey: 'alert_id',
        as: 'interventions'
      });
    }
  }

  Alert.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    reporter_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    location_lat: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: -90,
        max: 90 // Validation pour la latitude
      }
    },
    location_lng: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: -180,
        max: 180 // Validation pour la longitude
      }
    },
    status: {
      type: DataTypes.ENUM('EN_ATTENTE', 'ACCEPTEE', 'EN_COURS', 'RESOLUE'),
      defaultValue: 'EN_ATTENTE',
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM('Accidents', 'Incendies', 'Inondations', 'Malaises', 'Noyade', 'Autre'),
      allowNull: false
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Alert',
    tableName: 'Alerts',
    underscored: true
  });

  return Alert;
};
