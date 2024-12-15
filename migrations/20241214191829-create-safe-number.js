'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SafeNumbers', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      number: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          is: /^[0-9]{10,15}$/, // Validation d'un numéro de téléphone (10 à 15 chiffres)
        }
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true // Description facultative
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users', // Nom de la table des utilisateurs
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
    await queryInterface.dropTable('SafeNumbers');
  }
};
