const express = require('express');
const router = express.Router();
const { Pharmacy, sequelize } = require('../../models');
const { verifyRequestData } = require('../../config/utils');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');
const { Op } = require('sequelize');

// Fonction pour calculer la distance entre deux points GPS (formule de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

router.post('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getNearbyPharmacies",
        userId: req.user?.id || null,
        action: "Get Nearby Pharmacies",
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

        // Vérification des champs requis
        const requiredFields = ['latitude', 'longitude'];
        const verify = verifyRequestData(req.body, requiredFields);

        if (!verify.isValid) {
            logData.message = "Champs requis manquants";
            logData.status = "FAILED";
            logData.responseData = { missingFields: verify.missingFields };
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message, logData.responseData);
        }

        const { latitude, longitude, radius = 10 } = req.body;
        const userLat = parseFloat(latitude);
        const userLng = parseFloat(longitude);

        // Récupérer uniquement les pharmacies actives avec coordonnées GPS
        const pharmaciesWithCoords = await Pharmacy.findAll({
            where: {
                is_active: true,
                latitude: {
                    [Op.not]: null
                },
                longitude: {
                    [Op.not]: null
                }
            },
            order: [['name', 'ASC']]
        });

        // Calculer la distance pour chaque pharmacie
        const pharmaciesWithDistance = pharmaciesWithCoords.map(pharmacy => {
            const distance = calculateDistance(userLat, userLng, parseFloat(pharmacy.latitude), parseFloat(pharmacy.longitude));
            return {
                ...pharmacy.toJSON(),
                distance: parseFloat(distance.toFixed(2))
            };
        });

        // Filtrer les pharmacies dans le rayon spécifié et trier par distance
        const nearbyPharmacies = pharmaciesWithDistance
            .filter(p => p.distance <= radius)
            .sort((a, b) => a.distance - b.distance);

        // Obtenir les statistiques par commune pour la réponse
        const communeStats = {};
        nearbyPharmacies.forEach(pharmacy => {
            if (!communeStats[pharmacy.commune]) {
                communeStats[pharmacy.commune] = {
                    name: pharmacy.commune,
                    count: 0,
                    closestDistance: pharmacy.distance
                };
            }
            communeStats[pharmacy.commune].count++;

            // Mettre à jour la distance la plus proche pour cette commune
            if (pharmacy.distance < communeStats[pharmacy.commune].closestDistance) {
                communeStats[pharmacy.commune].closestDistance = pharmacy.distance;
            }
        });

        const response = {
            userLocation: {
                latitude: userLat,
                longitude: userLng
            },
            searchRadius: radius,
            totalPharmacies: nearbyPharmacies.length,
            totalCommunes: Object.keys(communeStats).length,
            communes: Object.values(communeStats).sort((a, b) => a.closestDistance - b.closestDistance),
            pharmacies: nearbyPharmacies
        };

        logData.message = "Pharmacies à proximité récupérées avec succès";
        logData.status = "SUCCESS";
        logData.responseData = {
            totalPharmacies: nearbyPharmacies.length,
            totalCommunes: Object.keys(communeStats).length
        };
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, response);

    } catch (error) {
        logData.message = "Erreur lors de la récupération des pharmacies à proximité";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;