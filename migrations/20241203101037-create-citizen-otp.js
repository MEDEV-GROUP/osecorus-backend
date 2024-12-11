'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CitizenOtps', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4 // Génération automatique d'un UUID
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          is: /^[0-9]+$/ // Permet uniquement les chiffres
        }
      },
      otp: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false // La date d'expiration doit être renseignée
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('CitizenOtps');
  }
};
