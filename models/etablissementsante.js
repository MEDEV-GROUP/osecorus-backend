'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EtablissementSante extends Model {
    static associate(models) {
      // Define associations here
    }
  }

  EtablissementSante.init({
    ville_commune: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quartier: {
      type: DataTypes.STRING,
      allowNull: false
    },
    categorie: {
      type: DataTypes.ENUM('Hôpital', 'Clinique médicale', 'Pharmacie', 'Clinique vétérinaire', 'Clinique dentaire'),
      allowNull: false
    },
    nom_etablissement: {
      type: DataTypes.STRING,
      allowNull: false
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'EtablissementSante',
  });

  return EtablissementSante;
};