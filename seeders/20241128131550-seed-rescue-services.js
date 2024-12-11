'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('RescueServices', [
      {
        id: '47baf977-2c3f-44d3-8bf1-81ac2cd3ec48', // Remplacez par des UUID générés
        name: 'Service des Pompiers',
        service_type: 'Lutte contre les incendies',
        contact_number: '112',
        description: 'Service spécialisé dans la lutte contre les incendies et les interventions de sauvetage.',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'ed759e0a-a2e9-411c-acb7-b37b0e1bd79b',
        name: 'Service Ambulancier',
        service_type: 'Assistance médicale',
        contact_number: '15',
        description: 'Fournit une assistance médicale d’urgence et transporte les patients vers les hôpitaux.',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '93fda12e-a30c-48a0-b930-1afdec029015', // Remplacez par des UUID générés
        name: 'Service de Police',
        service_type: 'Sécurité publique',
        contact_number: '17',
        description: 'Intervient pour assurer la sécurité publique, prévenir et résoudre les incidents criminels.',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('RescueServices', null, {});
  }
};
