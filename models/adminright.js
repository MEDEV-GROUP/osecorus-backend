'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AdminRight extends Model {
    static associate(models) {
      // Un droit admin appartient à un utilisateur
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  AdminRight.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidJson(value) {
          if (typeof value !== 'object') {
            throw new Error('Permissions doit être un objet JSON valide.');
          }
        }
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'AdminRight',
    tableName: 'AdminRights',
    underscored: true // Utilise le style snake_case
  });

  return AdminRight;
};
