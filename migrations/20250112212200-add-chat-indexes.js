'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Index pour la table Messages
    await queryInterface.addIndex('Messages', ['conversation_id'], {
      name: 'messages_conversation_id_idx'
    });
    await queryInterface.addIndex('Messages', ['sender_id'], {
      name: 'messages_sender_id_idx'
    });
    await queryInterface.addIndex('Messages', ['sent_at'], {
      name: 'messages_sent_at_idx'
    });
    await queryInterface.addIndex('Messages', ['is_read'], {
      name: 'messages_is_read_idx'
    });

    // Index pour la table Conversations
    await queryInterface.addIndex('Conversations', ['intervention_id'], {
      name: 'conversations_intervention_id_idx'
    });
    await queryInterface.addIndex('Conversations', ['is_active'], {
      name: 'conversations_is_active_idx'
    });

    // Index pour la table MessageMedia
    await queryInterface.addIndex('MessageMedia', ['message_id'], {
      name: 'message_media_message_id_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer les index dans l'ordre inverse
    await queryInterface.removeIndex('MessageMedia', 'message_media_message_id_idx');
    
    await queryInterface.removeIndex('Conversations', 'conversations_is_active_idx');
    await queryInterface.removeIndex('Conversations', 'conversations_intervention_id_idx');
    
    await queryInterface.removeIndex('Messages', 'messages_is_read_idx');
    await queryInterface.removeIndex('Messages', 'messages_sent_at_idx');
    await queryInterface.removeIndex('Messages', 'messages_sender_id_idx');
    await queryInterface.removeIndex('Messages', 'messages_conversation_id_idx');
  }
};