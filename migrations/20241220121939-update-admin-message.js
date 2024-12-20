'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('AdminMessages', 'level', {
      type: Sequelize.STRING,
      allowNull: false, // ou false si la colonne est obligatoire
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('AdminMessages', 'level');
  }
};
