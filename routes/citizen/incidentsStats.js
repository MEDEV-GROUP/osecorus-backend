const express = require('express');
const router = express.Router();
const { Incident } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const Logger = require('../../utils/Logger');
const { Op } = require('sequelize');

/**
 * Route publique pour obtenir les statistiques des incidents d'Abidjan
 * GET /citizen/incidents/stats
 * Aucune authentification requise
 */
router.get('/', async (req, res) => {
    const logData = {
        message: "",
        source: "getIncidentsStats",
        userId: null,
        action: "Get Incidents Statistics",
        ipAddress: req.ip,
        requestData: req.query,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const {
            period = 'all',  // all, month, week, day
            commune = null,
            type = null,
            limit = null
        } = req.query;

        // Construire les conditions de filtre
        let whereConditions = {
            is_active: true
        };

        // Filtre par période
        if (period !== 'all') {
            const now = new Date();
            let startDate;

            switch (period) {
                case 'day':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                default:
                    startDate = null;
            }

            if (startDate) {
                whereConditions.date = {
                    [Op.gte]: startDate
                };
            }
        }

        // Filtre par commune
        if (commune) {
            whereConditions.commune = commune;
        }

        // Filtre par type d'incident
        if (type) {
            whereConditions.type_incident = type;
        }

        // 1. Statistiques générales
        const totalIncidents = await Incident.count({
            where: whereConditions
        });

        // 2. Statistiques par type d'incident
        const statsByType = await Incident.findAll({
            attributes: [
                'type_incident',
                [Incident.sequelize.fn('COUNT', Incident.sequelize.col('id')), 'count']
            ],
            where: whereConditions,
            group: ['type_incident'],
            order: [[Incident.sequelize.fn('COUNT', Incident.sequelize.col('id')), 'DESC']],
            raw: true
        });

        // 3. Statistiques par commune
        const statsByCommune = await Incident.findAll({
            attributes: [
                'commune',
                [Incident.sequelize.fn('COUNT', Incident.sequelize.col('id')), 'count']
            ],
            where: whereConditions,
            group: ['commune'],
            order: [[Incident.sequelize.fn('COUNT', Incident.sequelize.col('id')), 'DESC']],
            raw: true
        });

        // 4. Tendances par mois (derniers 12 mois)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const monthlyTrends = await Incident.findAll({
            attributes: [
                [Incident.sequelize.fn('DATE_TRUNC', 'month', Incident.sequelize.col('date')), 'month'],
                [Incident.sequelize.fn('COUNT', Incident.sequelize.col('id')), 'count']
            ],
            where: {
                ...whereConditions,
                date: {
                    [Op.gte]: twelveMonthsAgo
                }
            },
            group: [Incident.sequelize.fn('DATE_TRUNC', 'month', Incident.sequelize.col('date'))],
            order: [[Incident.sequelize.fn('DATE_TRUNC', 'month', Incident.sequelize.col('date')), 'ASC']],
            raw: true
        });

        // 5. Incidents récents (limités)
        const recentIncidentsLimit = limit ? parseInt(limit) : 10;
        const recentIncidents = await Incident.findAll({
            where: whereConditions,
            attributes: [
                'id',
                'date',
                'type_incident',
                'commune',
                'latitude',
                'longitude',
                'description'
            ],
            order: [['date', 'DESC']],
            limit: recentIncidentsLimit
        });

        // 6. Zones les plus touchées (top 5)
        const topZones = statsByCommune.slice(0, 5);

        // 7. Types d'incidents les plus fréquents
        const topIncidentTypes = statsByType.slice(0, 6);

        // 8. Calculer les pourcentages
        const typePercentages = statsByType.map(stat => ({
            type_incident: stat.type_incident,
            count: parseInt(stat.count),
            percentage: totalIncidents > 0 ? ((parseInt(stat.count) / totalIncidents) * 100).toFixed(2) : 0
        }));

        const communePercentages = statsByCommune.map(stat => ({
            commune: stat.commune,
            count: parseInt(stat.count),
            percentage: totalIncidents > 0 ? ((parseInt(stat.count) / totalIncidents) * 100).toFixed(2) : 0
        }));

        // 9. Période d'analyse
        const analysisInfo = {
            period: period,
            filters: {
                commune: commune || 'Toutes',
                type: type || 'Tous',
                limit: recentIncidentsLimit
            },
            generated_at: new Date().toISOString(),
            total_incidents: totalIncidents
        };

        // Construire la réponse finale
        const responseData = {
            analysis_info: analysisInfo,
            summary: {
                total_incidents: totalIncidents,
                unique_communes: statsByCommune.length,
                unique_types: statsByType.length,
                most_affected_commune: statsByCommune[0]?.commune || null,
                most_common_incident: statsByType[0]?.type_incident || null
            },
            statistics: {
                by_type: typePercentages,
                by_commune: communePercentages,
                top_zones: topZones,
                top_incident_types: topIncidentTypes
            },
            trends: {
                monthly: monthlyTrends.map(trend => ({
                    month: trend.month,
                    count: parseInt(trend.count)
                }))
            },
            recent_incidents: recentIncidents.map(incident => ({
                id: incident.id,
                date: incident.date,
                type: incident.type_incident,
                commune: incident.commune,
                location: {
                    latitude: incident.latitude,
                    longitude: incident.longitude
                },
                description: incident.description?.substring(0, 100) + (incident.description?.length > 100 ? '...' : '')
            }))
        };

        logData.message = "Statistiques des incidents récupérées avec succès";
        logData.status = "SUCCESS";
        logData.responseData = {
            total: totalIncidents,
            period: period,
            filters_applied: commune || type ? true : false
        };
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, responseData);

    } catch (error) {
        logData.message = "Erreur lors de la récupération des statistiques des incidents";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

/**
 * Route pour obtenir les incidents dans un rayon donné
 * GET /citizen/incidents/nearby?lat=X&lng=Y&radius=Z
 */
router.get('/nearby', async (req, res) => {
    const logData = {
        message: "",
        source: "getNearbyIncidents",
        userId: null,
        action: "Get Nearby Incidents",
        ipAddress: req.ip,
        requestData: req.query,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { lat, lng, radius = 5 } = req.query;

        // Validation des paramètres
        if (!lat || !lng) {
            logData.message = "Latitude et longitude requises";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message);
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusKm = parseFloat(radius);

        if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
            logData.message = "Paramètres de géolocalisation invalides";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message);
        }

        // Utiliser la méthode du modèle pour trouver les incidents proches
        const nearbyIncidents = await Incident.findNearby(latitude, longitude, radiusKm);

        const responseData = {
            search_center: {
                latitude: latitude,
                longitude: longitude
            },
            search_radius_km: radiusKm,
            total_found: nearbyIncidents.length,
            incidents: nearbyIncidents.map(incident => ({
                id: incident.id,
                date: incident.date,
                type: incident.type_incident,
                commune: incident.commune,
                location: {
                    latitude: incident.latitude,
                    longitude: incident.longitude
                },
                description: incident.description?.substring(0, 100) + (incident.description?.length > 100 ? '...' : ''),
                distance_km: Incident.getDistance(latitude, longitude, incident.latitude, incident.longitude).toFixed(2)
            }))
        };

        logData.message = "Incidents proches récupérés avec succès";
        logData.status = "SUCCESS";
        logData.responseData = {
            total_found: nearbyIncidents.length,
            radius_km: radiusKm
        };
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, responseData);

    } catch (error) {
        logData.message = "Erreur lors de la recherche d'incidents proches";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;