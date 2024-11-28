'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RescueMember extends Model {
    static associate(models) {
      // Un membre appartient à un utilisateur
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      // Un membre appartient à un service de secours
      this.belongsTo(models.RescueService, {
        foreignKey: 'rescue_service_id',
        as: 'service'
      });
    }
  }

  RescueMember.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    rescue_service_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    position: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100] // Limitation de la longueur pour une description claire
      }
    },
    badge_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 50] // Validation optionnelle pour une longueur correcte
      }
    },
    is_on_duty: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'RescueMember',
    tableName: 'RescueMembers',
    underscored: true // Adopte le style snake_case
  });

  return RescueMember;
};
