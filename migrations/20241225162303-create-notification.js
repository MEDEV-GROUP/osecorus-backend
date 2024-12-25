'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Création de la table d'abord
    await queryInterface.createTable('Notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      sender_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('MASS', 'UNIQUE'),
        allowNull: false
      },
      target: {
        type: Sequelize.ENUM('RESCUE', 'CITIZEN'),
        allowNull: true
      },
      recipient_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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

    // Puis création des index séparément
    await queryInterface.addIndex('Notifications', ['sender_id'], {
      name: 'notifications_sender_id'
    });

    await queryInterface.addIndex('Notifications', ['recipient_id'], {
      name: 'notifications_recipient_id'
    });

    await queryInterface.addIndex('Notifications', ['type'], {
      name: 'notifications_type'
    });
  },

  async down(queryInterface, Sequelize) {
    // Suppression du type ENUM
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Notifications_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Notifications_target";');
    
    // Suppression de la table
    await queryInterface.dropTable('Notifications');
  }
};