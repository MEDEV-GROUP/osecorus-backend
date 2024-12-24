'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Intervention extends Model {
    /**
     * Définition des associations
     */
    static associate(models) {
      // Une intervention appartient à une alerte
      this.belongsTo(models.Alert, {
        foreignKey: 'alert_id',
        as: 'alert'
      });

      // Une intervention appartient à un membre de secours
      this.belongsTo(models.RescueMember, {
        foreignKey: 'rescue_member_id',
        as: 'rescueMember'
      });

      // Une intervention a une conversation
      this.hasOne(models.Conversation, {
        foreignKey: 'intervention_id',
        as: 'conversation'
      });
    }
  }

  Intervention.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    alert_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    rescue_member_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('EN_ROUTE', 'SUR_PLACE', 'TERMINEE', 'ANNULEE'),
      allowNull: false,
      defaultValue: 'EN_ROUTE'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    arrival_time: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Intervention',
    tableName: 'Interventions',
    underscored: true // Utilisation de snake_case pour les colonnes
  });

  return Intervention;
};