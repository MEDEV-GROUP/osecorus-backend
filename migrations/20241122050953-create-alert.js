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
        type: Sequelize.ENUM('EN_ATTENTE', 'ACCEPTEE', 'EN_COURS', 'RESOLUE'), // Mise à jour des valeurs ENUM en français
        allowNull: false,
        defaultValue: 'EN_ATTENTE'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category: {
        type: Sequelize.ENUM('Accidents', 'Incendies', 'Inondations', 'Malaises', 'Noyade', 'Autre'), // Passage en ENUM pour des catégories définies
        allowNull: false
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

    await queryInterface.addIndex('Alerts', ['category'], {
      name: 'alerts_category_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Supprimer les contraintes et les index
      await queryInterface.removeIndex('Alerts', 'alerts_reporter_id_idx').catch(() => {
        console.log("L'index reporter_id n'existe peut-être pas déjà");
      });

      await queryInterface.removeIndex('Alerts', 'alerts_status_idx').catch(() => {
        console.log("L'index status n'existe peut-être pas déjà");
      });

      await queryInterface.removeIndex('Alerts', 'alerts_category_idx').catch(() => {
        console.log("L'index category n'existe peut-être pas déjà");
      });

      // Supprimer les valeurs ENUM ajoutées (important pour éviter des erreurs si la migration est rejouée)
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Alerts_status";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Alerts_category";');

      // Supprimer la table
      await queryInterface.dropTable('Alerts');
    } catch (error) {
      console.error('Erreur dans la migration down de Alerts:', error);
      throw error;
    }
  }
};
