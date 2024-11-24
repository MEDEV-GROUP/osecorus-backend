'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            // define association here
        }
    }
    User.init({
        // 1. Ajout de l'ID avec UUID
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        email: DataTypes.STRING,
        password_hash: DataTypes.STRING,
        phone_number: DataTypes.STRING,
        // 2. Définition des valeurs de l'ENUM
        role: {
            type: DataTypes.ENUM('CITIZEN', 'RESCUE_MEMBER', 'ADMIN'),
            defaultValue: 'CITIZEN'
        },
        first_name: DataTypes.STRING,
        last_name: DataTypes.STRING,
        // 3. Ajout d'une valeur par défaut pour is_active
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'User',
        // 4. Ajout de l'option underscored
        underscored: true,
    });
    return User;
};