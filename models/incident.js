'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Incident extends Model {
    /**
     * Définition des associations
     */
    static associate(models) {
      // Définir ici les associations si nécessaire
      // Par exemple, un incident pourrait être lié à un utilisateur qui l'a signalé
      // this.belongsTo(models.User, { foreignKey: 'reporter_id', as: 'reporter' });
    }

    /**
     * Méthodes utiles pour le modèle
     */

    // Méthode pour obtenir la distance entre deux points (en km)
    static getDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // Rayon de la Terre en km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    // Méthode pour trouver les incidents dans un rayon donné
    static async findNearby(latitude, longitude, radiusKm = 5) {
      const incidents = await this.findAll({
        where: {
          is_active: true
        }
      });

      return incidents.filter(incident => {
        const distance = this.getDistance(
          latitude, longitude,
          incident.latitude, incident.longitude
        );
        return distance <= radiusKm;
      });
    }

    // Méthode pour obtenir les statistiques par type d'incident
    static async getStatsByType() {
      const stats = await this.findAll({
        attributes: [
          'type_incident',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          is_active: true
        },
        group: ['type_incident'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
      });

      return stats;
    }

    // Méthode pour obtenir les statistiques par commune
    static async getStatsByCommune() {
      const stats = await this.findAll({
        attributes: [
          'commune',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          is_active: true
        },
        group: ['commune'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
      });

      return stats;
    }
  }

  Incident.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        notEmpty: true
      }
    },
    type_incident: {
      type: DataTypes.ENUM('Inondation', 'Malaise', 'Vol', 'Agression', 'Accident de route', 'Incendie'),
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [['Inondation', 'Malaise', 'Vol', 'Agression', 'Accident de route', 'Incendie']]
      }
    },
    commune: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        isFloat: true,
        min: -90,
        max: 90
      }
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        isFloat: true,
        min: -180,
        max: 180
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000] // Limite de 1000 caractères
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Incident',
    tableName: 'Incidents',
    underscored: true,

    // Hooks
    hooks: {
      beforeSave: (incident) => {
        // Validation personnalisée avant sauvegarde
        if (incident.latitude < -90 || incident.latitude > 90) {
          throw new Error('Latitude invalide');
        }
        if (incident.longitude < -180 || incident.longitude > 180) {
          throw new Error('Longitude invalide');
        }
      }
    },

    // Scopes pour faciliter les requêtes
    scopes: {
      active: {
        where: {
          is_active: true
        }
      },
      byType: (type) => ({
        where: {
          type_incident: type,
          is_active: true
        }
      }),
      byCommune: (commune) => ({
        where: {
          commune: commune,
          is_active: true
        }
      }),
      recent: (days = 7) => ({
        where: {
          date: {
            [sequelize.Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          },
          is_active: true
        }
      })
    }
  });

  return Incident;
};