'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Définition des associations
      this.hasMany(models.Alert, { foreignKey: 'reporter_id', as: 'alerts' });
      this.hasOne(models.RescueMember, { foreignKey: 'user_id', as: 'rescueMember' });
      this.hasOne(models.AdminRight, { foreignKey: 'user_id', as: 'adminRight' });
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true // Validation d'email
      }
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^[0-9]*$/ // Permet uniquement les chiffres
      }
    },
    role: {
      type: DataTypes.ENUM('CITIZEN', 'RESCUE_MEMBER', 'ADMIN'),
      defaultValue: 'CITIZEN'
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    underscored: true
  });

  return User;
};
