'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AlertMedia extends Model {
        static associate(models) {
            // define association here
            AlertMedia.belongsTo(models.Alert, {
                foreignKey: 'alert_id'
            });
        }
    }
    AlertMedia.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        alert_id: DataTypes.UUID,
        media_type: {
            type: DataTypes.ENUM('PHOTO', 'VIDEO', 'AUDIO'),
            allowNull: false
        },
        media_url: DataTypes.STRING,
        thumbnail_url: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'AlertMedia',
        tableName: 'AlertMedia',  // Force ce nom exact
        underscored: true,
    });
    return AlertMedia;
};