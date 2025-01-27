'use strict';

module.exports = {
 async up(queryInterface, Sequelize) {
   await queryInterface.createTable('MessageMedia', {
     id: {
       type: Sequelize.UUID,
       defaultValue: Sequelize.UUIDV4,
       primaryKey: true
     },
     message_id: {
       type: Sequelize.UUID,
       allowNull: false,
       references: {
         model: 'Messages', 
         key: 'id'
       },
       onUpdate: 'CASCADE',
       onDelete: 'CASCADE'
     },
     media_type: {
       type: Sequelize.ENUM('AUDIO', 'IMAGE'),
       allowNull: false
     },
     media_url: {
       type: Sequelize.STRING,
       allowNull: false
     },
     thumbnail_url: {
       type: Sequelize.STRING,
       allowNull: true
     },
     created_at: {
       type: Sequelize.DATE,
       allowNull: false,
       defaultValue: Sequelize.fn('NOW')
     },
     updated_at: {
       type: Sequelize.DATE,
       allowNull: false,
       defaultValue: Sequelize.fn('NOW')
     }
   });
 },

 async down(queryInterface, Sequelize) {
   // Suppression du type ENUM
   
   // Suppression de la table
   await queryInterface.dropTable('MessageMedia');
 }
};