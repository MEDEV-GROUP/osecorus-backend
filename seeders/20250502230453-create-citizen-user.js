'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash('Lycoris99@', 10);

    // Créer l'utilisateur citoyen
    const userId = uuidv4();

    await queryInterface.bulkInsert('Users', [{
      id: userId,
      email: 'citizen0759670150@citizen.com', // Email formaté avec le numéro
      password_hash: hashedPassword,
      phone_number: '0759670150',
      role: 'CITIZEN',
      first_name: 'Osecours',
      last_name: 'Test',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // Ajouter également une photo de profil pour l'utilisateur
    await queryInterface.bulkInsert('UserPhotos', [{
      id: uuidv4(),
      user_id: userId,
      photo_url: 'others/avatar.png', // Utilisation de l'avatar par défaut
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  async down(queryInterface, Sequelize) {
    // Supprimer d'abord les photos associées à l'utilisateur
    await queryInterface.bulkDelete('UserPhotos', {
      user_id: {
        [Sequelize.Op.in]: [
          Sequelize.literal(`(SELECT id FROM Users WHERE phone_number = '0759670150')`)
        ]
      }
    });

    // Supprimer l'utilisateur
    await queryInterface.bulkDelete('Users', {
      phone_number: '0759670150'
    });
  }
};