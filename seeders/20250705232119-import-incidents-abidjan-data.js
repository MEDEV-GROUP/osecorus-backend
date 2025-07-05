'use strict';
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Chemin vers le fichier CSV
      const csvFilePath = path.join(__dirname, '../Incidents___Abidjan.csv');

      // Vérifier si le fichier existe
      if (!fs.existsSync(csvFilePath)) {
        console.error('Le fichier Incidents___Abidjan.csv n\'existe pas dans le dossier seeders');
        throw new Error('Fichier CSV non trouvé');
      }

      // Lire le fichier CSV
      const csvContent = fs.readFileSync(csvFilePath, 'utf8');

      // Parser le CSV avec PapaParse
      const parseResult = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header) => {
          // Nettoyer les en-têtes
          return header.trim();
        }
      });

      if (parseResult.errors.length > 0) {
        console.error('Erreurs lors du parsing CSV:', parseResult.errors);
        throw new Error('Erreur lors du parsing du fichier CSV');
      }

      console.log(`Nombre d'incidents à importer: ${parseResult.data.length}`);

      // Transformer les données pour correspondre au modèle
      const incidents = parseResult.data.map(row => {
        // Validation et nettoyage des données
        const date = new Date(row.Date);
        if (isNaN(date.getTime())) {
          console.warn(`Date invalide pour la ligne: ${JSON.stringify(row)}`);
          return null;
        }

        const latitude = parseFloat(row.Latitude);
        const longitude = parseFloat(row.Longitude);

        if (isNaN(latitude) || isNaN(longitude)) {
          console.warn(`Coordonnées invalides pour la ligne: ${JSON.stringify(row)}`);
          return null;
        }

        // Validation des coordonnées pour Abidjan
        if (latitude < 5.0 || latitude > 6.0 || longitude < -5.0 || longitude > -3.0) {
          console.warn(`Coordonnées hors zone Abidjan: ${latitude}, ${longitude}`);
          return null;
        }

        return {
          id: uuidv4(),
          date: date,
          type_incident: row["Type d'incident"] || 'Autre',
          commune: row.Commune || 'Inconnue',
          latitude: latitude,
          longitude: longitude,
          description: row.Description || null,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        };
      }).filter(incident => incident !== null); // Filtrer les lignes invalides

      console.log(`Nombre d'incidents valides: ${incidents.length}`);

      if (incidents.length === 0) {
        console.warn('Aucun incident valide à importer');
        return;
      }

      // Insérer les données par lots pour optimiser les performances
      const batchSize = 50;
      let importedCount = 0;

      for (let i = 0; i < incidents.length; i += batchSize) {
        const batch = incidents.slice(i, i + batchSize);

        try {
          await queryInterface.bulkInsert('Incidents', batch);
          importedCount += batch.length;
          console.log(`Lot ${Math.floor(i / batchSize) + 1} importé: ${batch.length} incidents`);
        } catch (error) {
          console.error(`Erreur lors de l'importation du lot ${Math.floor(i / batchSize) + 1}:`, error);

          // Essayer d'insérer un par un en cas d'erreur de lot
          for (const incident of batch) {
            try {
              await queryInterface.bulkInsert('Incidents', [incident]);
              importedCount++;
            } catch (singleError) {
              console.error(`Erreur lors de l'insertion de l'incident ${incident.id}:`, singleError);
            }
          }
        }
      }

      console.log(`=== IMPORTATION TERMINÉE ===`);
      console.log(`Total d'incidents importés: ${importedCount}/${incidents.length}`);

      // Afficher quelques statistiques
      const stats = await queryInterface.sequelize.query(
        `SELECT 
          type_incident, 
          COUNT(*) as count 
        FROM "Incidents" 
        WHERE is_active = true 
        GROUP BY type_incident 
        ORDER BY count DESC`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log('\n=== STATISTIQUES PAR TYPE D\'INCIDENT ===');
      stats.forEach(stat => {
        console.log(`${stat.type_incident}: ${stat.count} incidents`);
      });

      const communeStats = await queryInterface.sequelize.query(
        `SELECT 
          commune, 
          COUNT(*) as count 
        FROM "Incidents" 
        WHERE is_active = true 
        GROUP BY commune 
        ORDER BY count DESC`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log('\n=== STATISTIQUES PAR COMMUNE ===');
      communeStats.forEach(stat => {
        console.log(`${stat.commune}: ${stat.count} incidents`);
      });

    } catch (error) {
      console.error('Erreur lors de l\'importation des incidents:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Supprimer tous les incidents importés
      await queryInterface.bulkDelete('Incidents', null, {});
      console.log('Tous les incidents ont été supprimés avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression des incidents:', error);
      throw error;
    }
  }
};