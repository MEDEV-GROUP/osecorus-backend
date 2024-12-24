'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
 class Conversation extends Model {
   /**
    * Définition des associations
    */
   static associate(models) {
     // Une conversation appartient à une intervention
     this.belongsTo(models.Intervention, {
       foreignKey: 'intervention_id',
       as: 'intervention'
     });

     // Une conversation a plusieurs messages
     this.hasMany(models.Message, {
       foreignKey: 'conversation_id',
       as: 'messages'
     });
   }
 }

 Conversation.init({
   id: {
     type: DataTypes.UUID,
     defaultValue: DataTypes.UUIDV4,
     primaryKey: true
   },
   intervention_id: {
     type: DataTypes.UUID,
     allowNull: false,
   },
   is_active: {
     type: DataTypes.BOOLEAN,
     allowNull: false,
     defaultValue: true
   }
 }, {
   sequelize,
   modelName: 'Conversation', 
   tableName: 'Conversations',
   underscored: true // Utilisation de snake_case pour les colonnes
 });

 return Conversation;
};