'use strict';
const { v4: uuidv4 } = require('uuid');
const XLSX = require('xlsx');
const path = require('path');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Lire le fichier Excel
      const filePath = path.join(__dirname, '../hospitaux_modifie_updated.xlsx');
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convertir en JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Préparer les données pour l'insertion
      const etablissements = jsonData.map(row => ({
        id: uuidv4(),
        ville_commune: row['Ville et commune'],
        quartier: row['Quartier'],
        categorie: row['Catégorie'],
        nom_etablissement: row['Nom de l\'établissement'],
        longitude: parseFloat(row['Longitude']),
        latitude: parseFloat(row['Latitude']),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }));

      // Insérer les données par lots de 100
      const batchSize = 100;
      for (let i = 0; i < etablissements.length; i += batchSize) {
        const batch = etablissements.slice(i, i + batchSize);
        await queryInterface.bulkInsert('EtablissementSantes', batch);
      }

      console.log(`${etablissements.length} établissements de santé importés avec succès`);
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('EtablissementSantes', null, {});
  }
};