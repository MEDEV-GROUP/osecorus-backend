'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Alert extends Model {
        static associate(models) {
            // define association here
            Alert.hasMany(models.AlertMedia, {
                foreignKey: 'alert_id'
            });
        }
    }
    Alert.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        reporter_id: DataTypes.UUID,
        location_lat: DataTypes.FLOAT,
        location_lng: DataTypes.FLOAT,
        status: {
            type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED'),
            defaultValue: 'PENDING'
        },
        description: DataTypes.TEXT,
        address: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'Alert',
        underscored: true,
    });
    return Alert;
};