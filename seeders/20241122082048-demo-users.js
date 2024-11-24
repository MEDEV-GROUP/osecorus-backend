'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
// seeders/XXXXXX-demo-users.js

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    return queryInterface.bulkInsert('Users', [
      {
        id: '11111111-1111-1111-1111-111111111111', // UUID fixe pour tests
        email: 'citizen@osecours.fr',
        password_hash: hashedPassword,
        phone_number: '0600000000',
        role: 'CITIZEN',
        first_name: 'Jean',
        last_name: 'Dupont',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '22222222-2222-2222-2222-222222222222', // UUID fixe pour tests
        email: 'admin@osecours.fr',
        password_hash: hashedPassword,
        phone_number: '0600000001',
        role: 'ADMIN',
        first_name: 'Admin',
        last_name: 'System',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // En utilisant les emails pour identifier précisément ces utilisateurs
    return queryInterface.bulkDelete('Users', {
      email: ['citizen@osecours.fr', 'admin@osecours.fr']
    }, {});
  }
};
