'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AlertMedia', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      alert_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Alerts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      media_type: {
        type: Sequelize.ENUM('PHOTO', 'VIDEO', 'AUDIO'),
        allowNull: false
      },
      media_url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      thumbnail_url: {
        type: Sequelize.STRING,
        allowNull: true
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

    // Ajouter les index
    await queryInterface.addIndex('AlertMedia', ['alert_id'], {
      name: 'alert_media_alert_id_idx'
    });
  },
  down: async (queryInterface, Sequelize) => {
    try {
      // Supprimer l'index s'il existe
      await queryInterface.removeIndex('AlertMedia', 'alert_media_alert_id_idx').catch(() => {
        console.log("L'index alert_id n'existe peut-être pas déjà");
      });

      // Supprimer la table
      await queryInterface.dropTable('AlertMedia');

      // Supprimer le type ENUM
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_AlertMedia_media_type;').catch(() => {
        console.log("Le type ENUM n'existe peut-être pas déjà");
      });
    } catch (error) {
      console.error('Erreur dans la migration down de AlertMedia:', error);
      throw error;
    }
  }
};