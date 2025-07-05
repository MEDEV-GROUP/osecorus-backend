'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('EtablissementSantes', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      ville_commune: {
        type: Sequelize.STRING,
        allowNull: false
      },
      quartier: {
        type: Sequelize.STRING,
        allowNull: false
      },
      categorie: {
        type: Sequelize.ENUM('Hôpital', 'Clinique médicale', 'Pharmacie', 'Clinique vétérinaire', 'Clinique dentaire'),
        allowNull: false
      },
      nom_etablissement: {
        type: Sequelize.STRING,
        allowNull: false
      },
      longitude: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      latitude: {
        type: Sequelize.FLOAT,
        allowNull: false
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

    // Ajouter les index
    await queryInterface.addIndex('EtablissementSantes', ['ville_commune'], {
      name: 'etablissement_santes_ville_commune_idx'
    });

    await queryInterface.addIndex('EtablissementSantes', ['categorie'], {
      name: 'etablissement_santes_categorie_idx'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('EtablissementSantes');
  }
};