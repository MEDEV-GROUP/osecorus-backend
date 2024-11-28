'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true // Validation pour vérifier que c'est un email valide
        }
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          is: /^[0-9]*$/ // Permet uniquement les chiffres
        }
      },
      role: {
        type: Sequelize.ENUM('CITIZEN', 'RESCUE_MEMBER', 'ADMIN'),
        allowNull: false,
        defaultValue: 'CITIZEN'
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING,
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
    await queryInterface.addIndex('Users', ['email'], {
      name: 'users_email_idx',
      unique: true
    });

    await queryInterface.addIndex('Users', ['role'], {
      name: 'users_role_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Supprimer les contraintes
      await queryInterface.removeConstraint('Users', 'users_email_idx').catch(() => {
        console.log("La contrainte email n'existe peut-être pas déjà");
      });

      // Supprimer les index
      await queryInterface.removeIndex('Users', 'users_email_idx').catch(() => {
        console.log("L'index email n'existe peut-être pas déjà");
      });

      await queryInterface.removeIndex('Users', 'users_role_idx').catch(() => {
        console.log("L'index role n'existe peut-être pas déjà");
      });

      // Supprimer la table
      await queryInterface.dropTable('Users');
    } catch (error) {
      console.error('Erreur dans la migration down de Users:', error);
      throw error;
    }
  }

};
