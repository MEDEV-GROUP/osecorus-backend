'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Logs', {
      id: {
        allowNull: false,
        autoIncrement: true, // Génère automatiquement un ID unique incrémental
        primaryKey: true, // Clé primaire
        type: Sequelize.INTEGER
      },
      ip: {
        type: Sequelize.STRING, // Adresse IP de l'utilisateur effectuant l'action
        allowNull: false
      },
      action: {
        type: Sequelize.STRING, // Action effectuée (ex : 'CREATE', 'UPDATE', 'DELETE', etc.)
        allowNull: false
      },
      route: {
        type: Sequelize.STRING, // Route API appelée (ex : '/create-rescue-member')
        allowNull: false
      },
      request: {
        type: Sequelize.JSON, // Données de la requête envoyée par l'utilisateur
        allowNull: false
      },
      response: {
        type: Sequelize.JSON, // Réponse retournée à l'utilisateur
        allowNull: false
      },
      response_time_ms: {
        type: Sequelize.INTEGER, // Temps de réponse en millisecondes
        allowNull: true
      },
      user_agent: {
        type: Sequelize.STRING, // Informations sur le navigateur ou l'agent utilisateur
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE, // Date et heure de la création de l'enregistrement
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE, // Date et heure de la dernière mise à jour de l'enregistrement
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Logs'); // Supprime la table 'Logs' si elle existe
  }
};
