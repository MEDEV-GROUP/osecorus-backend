'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RescueService extends Model {
    static associate(models) {
      // Association avec RescueMembers
      this.hasMany(models.RescueMember, {
        foreignKey: 'rescue_service_id',
        as: 'members'
      });
    }
  }

  RescueService.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    service_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contact_number: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^[0-9]*$/ // Valide uniquement les chiffres (optionnel)
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'RescueService',
    tableName: 'RescueServices',
    underscored: true // Active le snake_case pour les colonnes
  });

  return RescueService;
};
