'use strict';
const { v4: uuidv4 } = require('uuid');
const pharmacyData = require('../pharmacies_garde_ci.json'); // Placez votre fichier JSON à la racine

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const pharmacies = pharmacyData.pharmacies.map(pharmacy => ({
      id: uuidv4(),
      name: pharmacy.nom,
      address: pharmacy.adresse_complete || null,
      latitude: pharmacy.latitude ? parseFloat(pharmacy.latitude) : null,
      longitude: pharmacy.longitude ? parseFloat(pharmacy.longitude) : null,
      phone: null, // Pas de numéro de téléphone dans les données source
      commune: pharmacy.commune,
      category: pharmacy.categorie || 'Pharmacie',
      url_fiche: pharmacy.url_fiche || null,
      image_url: pharmacy.image_url || null,
      post_id: pharmacy.post_id || null,
      source_url: pharmacy.source_url || null,
      is_active: true,
      is_on_duty: false, // Par défaut, aucune pharmacie n'est de garde
      created_at: new Date(),
      updated_at: new Date()
    }));

    // Insérer les pharmacies par batch pour optimiser les performances
    const batchSize = 50;
    for (let i = 0; i < pharmacies.length; i += batchSize) {
      const batch = pharmacies.slice(i, i + batchSize);
      await queryInterface.bulkInsert('Pharmacies', batch);
    }

    console.log(`${pharmacies.length} pharmacies ont été importées avec succès.`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Pharmacies', null, {});
    console.log('Toutes les pharmacies ont été supprimées.');
  }
};