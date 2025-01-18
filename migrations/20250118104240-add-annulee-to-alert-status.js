'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE Alerts MODIFY COLUMN status ENUM('EN_ATTENTE', 'ACCEPTEE', 'EN_COURS', 'RESOLUE', 'ANNULEE') 
      NOT NULL DEFAULT 'EN_ATTENTE';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE Alerts MODIFY COLUMN status ENUM('EN_ATTENTE', 'ACCEPTEE', 'EN_COURS', 'RESOLUE') 
      NOT NULL DEFAULT 'EN_ATTENTE';
    `);
  }
};