'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
 class Message extends Model {
   /**
    * Définition des associations
    */
   static associate(models) {
     // Un message appartient à une conversation
     this.belongsTo(models.Conversation, {
       foreignKey: 'conversation_id',
       as: 'conversation'
     });

     // Un message appartient à un expéditeur (User)
     this.belongsTo(models.User, {
       foreignKey: 'sender_id',
       as: 'sender'
     });

     // Un message peut avoir plusieurs médias
     this.hasMany(models.MessageMedia, {
       foreignKey: 'message_id',
       as: 'media'
     });
   }
 }

 Message.init({
   id: {
     type: DataTypes.UUID,
     defaultValue: DataTypes.UUIDV4,
     primaryKey: true
   },
   conversation_id: {
     type: DataTypes.UUID,
     allowNull: false
   },
   sender_id: {
     type: DataTypes.UUID,
     allowNull: false
   },
   content: {
     type: DataTypes.TEXT,
     allowNull: false
   },
   sent_at: {
     type: DataTypes.DATE,
     allowNull: false,
     defaultValue: DataTypes.NOW
   },
   is_read: {
     type: DataTypes.BOOLEAN,
     allowNull: false,
     defaultValue: false
   },
   read_at: {
     type: DataTypes.DATE,
     allowNull: true
   }
 }, {
   sequelize,
   modelName: 'Message',
   tableName: 'Messages',
   underscored: true // Utilisation de snake_case pour les colonnes
 });

 return Message;
};