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
        allowNull: false,
        validate: {
          isUrl: true // Validation pour s'assurer que c'est une URL valide
        }
      },
      thumbnail_url: {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          isUrl: true // Validation pour une URL valide si elle est définie
        }
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

    // Ajouter les index
    await queryInterface.addIndex('AlertMedia', ['alert_id'], {
      name: 'alert_media_alert_id_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Supprimer les contraintes
      await queryInterface.removeConstraint('AlertMedia', 'alert_media_alert_id_idx').catch(() => {
        console.log("La contrainte alert_id n'existe peut-être pas déjà");
      });
  
      // Supprimer les index
      await queryInterface.removeIndex('AlertMedia', 'alert_media_alert_id_idx').catch(() => {
        console.log("L'index alert_id n'existe peut-être pas déjà");
      });
  
      // Supprimer la table
      await queryInterface.dropTable('AlertMedia');
    } catch (error) {
      console.error('Erreur dans la migration down de AlertMedia:', error);
      throw error;
    }
  }
  
};
