const express = require('express');
const router = express.Router();
const { Alert, sequelize } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');
const { Op } = require('sequelize');

// Fonction pour calculer la distance entre deux points GPS (formule de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
    // Rayon de la Terre en kilomètres
    const R = 6371;

    // Conversion des degrés en radians
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    // Formule de Haversine
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance en kilomètres

    return distance;
}

// Fonction pour obtenir un message d'alerte en fonction de la distance
function getWarningMessage(distance) {
    if (distance < 1) {
        return "URGENT: Une inondation est signalée à moins d'1 km de votre position. Prenez des mesures immédiates pour votre sécurité!";
    } else if (distance < 3) {
        return "ATTENTION: Une inondation est signalée à moins de 3 km. Restez vigilant et préparez-vous à évacuer si nécessaire.";
    } else if (distance < 5) {
        return "AVIS: Une inondation est signalée à proximité. Suivez les informations et restez prudent.";
    } else {
        return "Les inondations signalées sont encore loin de votre position, mais restez informé de l'évolution de la situation.";
    }
}

router.post('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getNearbyFloodAlerts",
        userId: req.user?.id || null,
        action: "Get Nearby Flood Alerts",
        ipAddress: req.ip,
        requestData: req.body,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;

        // Vérification que l'utilisateur est un citoyen
        if (user.role !== 'CITIZEN') {
            logData.message = "Accès interdit : seuls les citoyens peuvent effectuer cette action";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.unauthorized(res, logData.message);
        }

        // Vérifier les paramètres requis (latitude et longitude)
        const { latitude, longitude } = req.body;
        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
            logData.message = "Latitude et longitude valides requises";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message);
        }

        // Calculer la date d'il y a 24 heures
        const last24Hours = new Date();
        last24Hours.setHours(last24Hours.getHours() - 24);

        // Récupérer toutes les alertes d'inondation des dernières 24 heures
        // qui ne sont pas en attente (donc traitées ou en cours)
        const floodAlerts = await Alert.findAll({
            where: {
                category: 'Inondations',
                created_at: {
                    [Op.gte]: last24Hours
                },
                status: {
                    [Op.notIn]: ['EN_ATTENTE', 'ANNULEE']
                }
            },
            attributes: [
                'id',
                'location_lat',
                'location_lng',
                'address',
                'description',
                'status',
                'created_at',
                'updated_at'
            ],
            order: [['created_at', 'DESC']]
        });

        if (floodAlerts.length === 0) {
            logData.message = "Aucune alerte d'inondation dans les dernières 24 heures";
            logData.status = "SUCCESS";
            logData.responseData = {
                message: "Aucune inondation signalée dans votre région dans les dernières 24 heures.",
                alerts: []
            };
            await Logger.logEvent(logData);
            return ApiResponse.success(res, logData.message, logData.responseData);
        }

        // Calculer la distance pour chaque alerte et ajouter un message d'avertissement
        const alertsWithDistance = floodAlerts.map(alert => {
            const distance = calculateDistance(
                parseFloat(latitude),
                parseFloat(longitude),
                alert.location_lat,
                alert.location_lng
            );

            return {
                id: alert.id,
                location: {
                    lat: alert.location_lat,
                    lng: alert.location_lng
                },
                address: alert.address,
                description: alert.description,
                status: alert.status,
                createdAt: alert.created_at,
                updatedAt: alert.updated_at,
                distance: parseFloat(distance.toFixed(2)), // Distance en km avec 2 décimales
                warningMessage: getWarningMessage(distance)
            };
        });

        // Trier les alertes par distance (plus proche en premier)
        alertsWithDistance.sort((a, b) => a.distance - b.distance);

        // Créer un message général basé sur l'alerte la plus proche
        let generalMessage = "Aucune inondation proche détectée.";

        if (alertsWithDistance.length > 0) {
            const closestAlert = alertsWithDistance[0];
            generalMessage = closestAlert.warningMessage;
        }

        const response = {
            message: generalMessage,
            count: alertsWithDistance.length,
            alerts: alertsWithDistance
        };

        logData.message = "Alertes d'inondation à proximité récupérées avec succès";
        logData.status = "SUCCESS";
        logData.responseData = response;
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, response);

    } catch (error) {
        logData.message = "Erreur lors de la récupération des alertes d'inondation à proximité";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;