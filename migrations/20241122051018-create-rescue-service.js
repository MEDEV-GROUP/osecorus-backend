'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('RescueServices', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      service_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      contact_number: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          is: /^[0-9]*$/ // Valide uniquement les chiffres (optionnel)
        }
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    try {

      await queryInterface.dropTable('RescueServices');
    } catch (error) {
      console.error('Erreur dans la migration down de RescueServices:', error);
      throw error;
    }
  }

};
