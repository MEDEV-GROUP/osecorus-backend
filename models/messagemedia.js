'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
 class MessageMedia extends Model {
   /**
    * Définition des associations
    */
   static associate(models) {
     // Un média appartient à un message
     this.belongsTo(models.Message, {
       foreignKey: 'message_id',
       as: 'message'
     });
   }
 }

 MessageMedia.init({
   id: {
     type: DataTypes.UUID,
     defaultValue: DataTypes.UUIDV4,
     primaryKey: true
   },
   message_id: {
     type: DataTypes.UUID,
     allowNull: false
   },
   media_type: {
     type: DataTypes.ENUM('AUDIO', 'IMAGE'),
     allowNull: false
   },
   media_url: {
     type: DataTypes.STRING,
     allowNull: false
   },
   thumbnail_url: {
     type: DataTypes.STRING,
     allowNull: true
   }
 }, {
   sequelize,
   modelName: 'MessageMedia',
   tableName: 'MessageMedia',
   underscored: true // Utilisation de snake_case pour les colonnes
 });

 return MessageMedia;
};