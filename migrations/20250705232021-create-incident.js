'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Incidents', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      type_incident: {
        type: Sequelize.ENUM('Inondation', 'Malaise', 'Vol', 'Agression', 'Accident de route', 'Incendie'),
        allowNull: false
      },
      commune: {
        type: Sequelize.STRING,
        allowNull: false
      },
      latitude: {
        type: Sequelize.FLOAT,
        allowNull: false,
        validate: {
          min: -90,
          max: 90
        }
      },
      longitude: {
        type: Sequelize.FLOAT,
        allowNull: false,
        validate: {
          min: -180,
          max: 180
        }
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    // Ajouter les index pour optimiser les requêtes
    await queryInterface.addIndex('Incidents', ['date'], {
      name: 'incidents_date_idx'
    });

    await queryInterface.addIndex('Incidents', ['type_incident'], {
      name: 'incidents_type_incident_idx'
    });

    await queryInterface.addIndex('Incidents', ['commune'], {
      name: 'incidents_commune_idx'
    });

    // Index géospatial pour les coordonnées
    await queryInterface.addIndex('Incidents', ['latitude', 'longitude'], {
      name: 'incidents_geolocation_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Supprimer les index
      await queryInterface.removeIndex('Incidents', 'incidents_date_idx').catch(() => {
        console.log("L'index date n'existe peut-être pas déjà");
      });

      await queryInterface.removeIndex('Incidents', 'incidents_type_incident_idx').catch(() => {
        console.log("L'index type_incident n'existe peut-être pas déjà");
      });

      await queryInterface.removeIndex('Incidents', 'incidents_commune_idx').catch(() => {
        console.log("L'index commune n'existe peut-être pas déjà");
      });

      await queryInterface.removeIndex('Incidents', 'incidents_geolocation_idx').catch(() => {
        console.log("L'index geolocation n'existe peut-être pas déjà");
      });

      // Supprimer la table
      await queryInterface.dropTable('Incidents');
    } catch (error) {
      console.error('Erreur dans la migration down de Incidents:', error);
      throw error;
    }
  }
};