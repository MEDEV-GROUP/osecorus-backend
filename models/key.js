'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Key extends Model {
    static associate(models) {
      // Aucune association spécifique ici pour le moment
    }
  }

  Key.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Key',
    tableName: 'Keys',
    underscored: true, // Utilise le style snake_case
  });

  return Key;
};
