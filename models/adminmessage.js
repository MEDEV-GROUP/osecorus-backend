'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AdminMessage extends Model {
    static associate(models) {
      // Un message appartient à un administrateur
      this.belongsTo(models.User, {
        foreignKey: 'admin_id',
        as: 'admin',
      });
    }
  }

  AdminMessage.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      admin_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'AdminMessage',
      tableName: 'AdminMessages',
      underscored: true,
    }
  );

  return AdminMessage;
};
