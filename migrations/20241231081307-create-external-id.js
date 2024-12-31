// migrations/YYYYMMDDHHMMSS-create-external-ids.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ExternalIds', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
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
      external_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: false
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

    // Add index for faster lookups
    await queryInterface.addIndex('ExternalIds', ['user_id'], {
      name: 'external_ids_user_id'
    });
    await queryInterface.addIndex('ExternalIds', ['external_id'], {
      name: 'external_ids_external_id'
    });
  },

  async down(queryInterface, Sequelize) {
    try {
      // Supprimer les index
      await queryInterface.removeIndex('ExternalIds', 'external_ids_user_id').catch(() => {
        console.log("L'index user_id n'existe peut-être pas déjà");
      });

      await queryInterface.removeIndex('ExternalIds', 'external_ids_external_id').catch(() => {
        console.log("L'index external_id n'existe peut-être pas déjà");
      });

      // Supprimer la table
      await queryInterface.dropTable('ExternalIds');
    } catch (error) {
      console.error('Erreur dans la migration down de ExternalIds:', error);
      throw error;
    }
  }
};