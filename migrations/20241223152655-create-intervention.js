'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Création de la table
    await queryInterface.createTable('Interventions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      alert_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Alerts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      rescue_member_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'RescueMembers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('EN_ROUTE', 'SUR_PLACE', 'TERMINEE', 'ANNULEE'),
        allowNull: false,
        defaultValue: 'EN_ROUTE'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      arrival_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Création des index
    await queryInterface.addIndex('Interventions', ['alert_id'], {
      name: 'interventions_alert_id'
    });

    await queryInterface.addIndex('Interventions', ['rescue_member_id'], {
      name: 'interventions_rescue_member_id'
    });

    await queryInterface.addIndex('Interventions', ['status'], {
      name: 'interventions_status'
    });
  },

  async down(queryInterface, Sequelize) {

    // Suppression de la table
    await queryInterface.dropTable('Interventions');
  }
};