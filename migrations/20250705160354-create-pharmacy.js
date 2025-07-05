'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Pharmacies', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
        validate: {
          min: -90,
          max: 90
        }
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
        validate: {
          min: -180,
          max: 180
        }
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          is: /^[0-9+\-\s()]*$/
        }
      },
      commune: {
        type: Sequelize.STRING,
        allowNull: false
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'Pharmacie'
      },
      url_fiche: {
        type: Sequelize.STRING,
        allowNull: true
      },
      image_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      post_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      source_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      is_on_duty: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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

    // Ajouter les index pour optimiser les recherches
    await queryInterface.addIndex('Pharmacies', ['commune'], {
      name: 'pharmacies_commune_idx'
    });

    await queryInterface.addIndex('Pharmacies', ['is_active'], {
      name: 'pharmacies_is_active_idx'
    });

    await queryInterface.addIndex('Pharmacies', ['is_on_duty'], {
      name: 'pharmacies_is_on_duty_idx'
    });

    await queryInterface.addIndex('Pharmacies', ['latitude', 'longitude'], {
      name: 'pharmacies_location_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    try {
      // Supprimer les index
      await queryInterface.removeIndex('Pharmacies', 'pharmacies_commune_idx').catch(() => {
        console.log("L'index commune n'existe peut-être pas déjà");
      });

      await queryInterface.removeIndex('Pharmacies', 'pharmacies_is_active_idx').catch(() => {
        console.log("L'index is_active n'existe peut-être pas déjà");
      });

      await queryInterface.removeIndex('Pharmacies', 'pharmacies_is_on_duty_idx').catch(() => {
        console.log("L'index is_on_duty n'existe peut-être pas déjà");
      });

      await queryInterface.removeIndex('Pharmacies', 'pharmacies_location_idx').catch(() => {
        console.log("L'index location n'existe peut-être pas déjà");
      });

      // Supprimer la table
      await queryInterface.dropTable('Pharmacies');
    } catch (error) {
      console.error('Erreur dans la migration down de Pharmacies:', error);
      throw error;
    }
  }
};