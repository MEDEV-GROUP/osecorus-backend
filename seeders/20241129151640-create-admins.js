'use strict';
const bcrypt = require('bcryptjs'); // Pour le hachage des mots de passe
const { v4: uuidv4 } = require('uuid'); // Générateur d'UUID

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPasswords = await Promise.all([
      bcrypt.hash('@TW6za8kP52Br68Eh', 10),
      bcrypt.hash('@xp6sMN7q2K2T67hK', 10),
      bcrypt.hash('@5T8zMAkBw3dX5r35', 10),
      bcrypt.hash('@6Lp5Q9Jip3JyH7s3', 10),
      bcrypt.hash('@53zc5X4RCt34dYqP', 10)
    ]);

    await queryInterface.bulkInsert('Users', [
      {
        id: uuidv4(),
        email: 'lycoris99@blue.com',
        password_hash: hashedPasswords[0],
        first_name: 'Lycoris',
        last_name: 'Blue',
        role: 'ADMIN',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'edgar@junior.com',
        password_hash: hashedPasswords[1],
        first_name: 'Edgar',
        last_name: 'Junior',
        role: 'ADMIN',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'valent@vds.com',
        password_hash: hashedPasswords[2],
        first_name: 'Valent',
        last_name: 'Vds',
        role: 'ADMIN',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'tienne@paul.com',
        password_hash: hashedPasswords[3],
        first_name: 'Tienne',
        last_name: 'Paul',
        role: 'ADMIN',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'daniel@boua.com',
        password_hash: hashedPasswords[4],
        first_name: 'Daniel',
        last_name: 'Boua',
        role: 'ADMIN',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', {
      email: { [Sequelize.Op.in]: ['lycoris99@blue.com', 'edgar@junior.com', 'valent@vds.com', 'tienne@paul.com', 'daniel@boua.com' ] }
    });
  }
};
