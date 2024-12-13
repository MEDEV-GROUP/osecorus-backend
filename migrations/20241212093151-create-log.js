'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Logs', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      source: {
        type: Sequelize.STRING
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      action: {
        type: Sequelize.STRING
      },
      ip_address: {
        type: Sequelize.STRING
      },
      request_data: {
        type: Sequelize.JSON
      },
      response_data: {
        type: Sequelize.JSON
      },
      status: {
        type: Sequelize.STRING
      },
      environment: {
        type: Sequelize.STRING
      },
      device_info: {
        type: Sequelize.JSON
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

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Logs');
  }
};
