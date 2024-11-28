'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Alerts', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      reporter_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users', // Nom exact du modèle cible
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      location_lat: {
        type: Sequelize.FLOAT,
        allowNull: false,
        validate: {
          min: -90,
          max: 90 // Validations pour des coordonnées géographiques valides
        }
      },
      location_lng: {
        type: Sequelize.FLOAT,
        allowNull: false,
        validate: {
          min: -180,
          max: 180
        }
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED'),
        allowNull: false,
        defaultValue: 'PENDING'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true
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
    await queryInterface.addIndex('Alerts', ['reporter_id'], {
      name: 'alerts_reporter_id_idx'
    });

    await queryInterface.addIndex('Alerts', ['status'], {
      name: 'alerts_status_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Supprimer les contraintes
      await queryInterface.removeConstraint('Alerts', 'alerts_reporter_id_idx').catch(() => {
        console.log("La contrainte reporter_id n'existe peut-être pas déjà");
      });

      // Supprimer les index
      await queryInterface.removeIndex('Alerts', 'alerts_reporter_id_idx').catch(() => {
        console.log("L'index reporter_id n'existe peut-être pas déjà");
      });

      await queryInterface.removeIndex('Alerts', 'alerts_status_idx').catch(() => {
        console.log("L'index status n'existe peut-être pas déjà");
      });

      // Supprimer la table
      await queryInterface.dropTable('Alerts');
    } catch (error) {
      console.error('Erreur dans la migration down de Alerts:', error);
      throw error;
    }
  }
};
