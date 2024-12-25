'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'sender_id',
        as: 'sender'
      });
      
      this.belongsTo(models.User, {
        foreignKey: 'recipient_id',
        as: 'recipient'
      });
    }
  }

  Notification.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sender_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('MASS', 'UNIQUE'),
      allowNull: false
    },
    target: {
      type: DataTypes.ENUM('RESCUE', 'CITIZEN'),
      allowNull: true,
      validate: {
        isValidTarget(value) {
          if (this.type === 'MASS' && !value) {
            throw new Error('Target is required for MASS notifications');
          }
        }
      }
    },
    recipient_id: {
      type: DataTypes.UUID,
      allowNull: true,
      validate: {
        isValidRecipient(value) {
          if (this.type === 'UNIQUE' && !value) {
            throw new Error('Recipient ID is required for UNIQUE notifications');
          }
        }
      }
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'Notifications',
    underscored: true
  });

  return Notification;
};