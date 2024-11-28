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
      type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED'),
      defaultValue: 'PENDING',
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
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
