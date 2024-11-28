'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Token extends Model {
    static associate(models) {
      // Un token appartient à un utilisateur
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  Token.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['ACCESS', 'REFRESH']] // Limite les types de token
      }
    },
    is_revoked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Token',
    tableName: 'Tokens',
    underscored: true, // Utilise le style snake_case pour les colonnes
    timestamps: true // Active created_at et updated_at automatiquement
  });

  return Token;
};
