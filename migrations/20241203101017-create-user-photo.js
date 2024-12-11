'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserPhotos', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4 // Génère automatiquement un UUID
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users', // Table liée
          key: 'id'
        },
        onUpdate: 'CASCADE', // Mise à jour en cascade
        onDelete: 'CASCADE'  // Suppression en cascade
      },
      photo_url: {
        type: Sequelize.STRING,
        allowNull: false // La photo doit obligatoirement être fournie
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
    await queryInterface.dropTable('UserPhotos');
  }
};
