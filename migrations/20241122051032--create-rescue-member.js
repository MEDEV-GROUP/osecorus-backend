'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('RescueMembers', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      rescue_service_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'RescueServices',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      position: {
        type: Sequelize.STRING,
        allowNull: false
      },
      badge_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      is_on_duty: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Ajouter les index
    await queryInterface.addIndex('RescueMembers', ['user_id'], {
      name: 'rescue_members_user_id_idx'
    });

    await queryInterface.addIndex('RescueMembers', ['rescue_service_id'], {
      name: 'rescue_members_service_id_idx'
    });

    await queryInterface.addIndex('RescueMembers', ['badge_number'], {
      name: 'rescue_members_badge_number_idx',
      unique: true
    });
  },
  down: async (queryInterface, Sequelize) => {
    try {
      // Supprimer les index s'ils existent
      await queryInterface.removeIndex('RescueMembers', 'rescue_members_user_id_idx').catch(() => {
        console.log("L'index user_id n'existe peut-être pas déjà");
      });
      
      await queryInterface.removeIndex('RescueMembers', 'rescue_members_service_id_idx').catch(() => {
        console.log("L'index service_id n'existe peut-être pas déjà");
      });
      
      await queryInterface.removeIndex('RescueMembers', 'rescue_members_badge_number_idx').catch(() => {
        console.log("L'index badge_number n'existe peut-être pas déjà");
      });

      // Ensuite supprimer la table
      await queryInterface.dropTable('RescueMembers');
    } catch (error) {
      console.error('Erreur dans la migration down de RescueMembers:', error);
      throw error;
    }
  }
};