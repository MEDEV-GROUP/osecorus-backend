'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AdminRights', {
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
      permissions: {
        type: Sequelize.JSON,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
    await queryInterface.addIndex('AdminRights', ['user_id'], {
      name: 'admin_rights_user_id_idx',
      unique: true
    });
  },
  down: async (queryInterface, Sequelize) => {
    try {
      // D'abord supprimer l'index s'il existe
      await queryInterface.removeIndex('AdminRights', 'admin_rights_user_id_idx').catch(() => {
        console.log("L'index n'existe peut-être pas déjà");
      });
      // Ensuite supprimer la table
      await queryInterface.dropTable('AdminRights');
    } catch (error) {
      console.error('Erreur dans la migration down:', error);
      throw error;
    }
  }
};