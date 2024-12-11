'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tokens', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      token: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isIn: [['ACCESS', 'REFRESH']]
        }
      },
      is_revoked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
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

    // Ajouter un index sur user_id pour optimiser les recherches
    await queryInterface.addIndex('Tokens', ['user_id'], {
      name: 'tokens_user_id_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    try {
      // Supprimer la contrainte de clé étrangère avant de supprimer l'index
      await queryInterface.removeConstraint('Tokens', 'tokens_user_id_fk').catch(() => {
        console.log("La contrainte tokens_user_id_fk n'existe peut-être pas déjà");
      });

      // Supprimer l'index
      await queryInterface.removeIndex('Tokens', 'tokens_user_id_idx').catch(() => {
        console.log("L'index tokens_user_id_idx n'existe peut-être pas déjà");
      });

      // Supprimer la table
      await queryInterface.dropTable('Tokens');
    } catch (error) {
      console.error('Erreur lors de la migration down de Tokens:', error);
      throw error;
    }
  }
};
