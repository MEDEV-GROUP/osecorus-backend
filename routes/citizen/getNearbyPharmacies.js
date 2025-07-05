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

// Fonction pour calculer la distance moyenne d'une commune par rapport à un point
function calculateCommuneDistance(userLat, userLng, communePharmacies) {
    const pharmaciesWithCoords = communePharmacies.filter(p => p.latitude && p.longitude);

    if (pharmaciesWithCoords.length === 0) {
        return 999999; // Distance très élevée pour les communes sans coordonnées
    }

    const totalDistance = pharmaciesWithCoords.reduce((sum, pharmacy) => {
        return sum + calculateDistance(userLat, userLng, parseFloat(pharmacy.latitude), parseFloat(pharmacy.longitude));
    }, 0);

    return totalDistance / pharmaciesWithCoords.length;
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

        // Récupérer toutes les pharmacies actives
        const allPharmacies = await Pharmacy.findAll({
            where: {
                is_active: true
            },
            order: [['name', 'ASC']]
        });

        // Séparer les pharmacies avec et sans coordonnées
        const pharmaciesWithCoords = [];
        const pharmaciesWithoutCoords = [];

        allPharmacies.forEach(pharmacy => {
            if (pharmacy.latitude && pharmacy.longitude) {
                const distance = calculateDistance(userLat, userLng, parseFloat(pharmacy.latitude), parseFloat(pharmacy.longitude));
                pharmaciesWithCoords.push({
                    ...pharmacy.toJSON(),
                    distance: parseFloat(distance.toFixed(2))
                });
            } else {
                pharmaciesWithoutCoords.push({
                    ...pharmacy.toJSON(),
                    distance: null
                });
            }
        });

        // Filtrer les pharmacies dans le rayon spécifié
        const nearbyPharmacies = pharmaciesWithCoords.filter(p => p.distance <= radius);

        // Trier toutes les pharmacies avec coordonnées par distance (les plus proches en premier)
        nearbyPharmacies.sort((a, b) => a.distance - b.distance);

        // Obtenir les communes des pharmacies trouvées
        const foundCommunes = [...new Set(nearbyPharmacies.map(p => p.commune))];

        // Ajouter les pharmacies sans coordonnées des mêmes communes à la fin
        const pharmaciesWithoutCoordsFromSameCommunes = pharmaciesWithoutCoords
            .filter(p => foundCommunes.includes(p.commune))
            .sort((a, b) => a.name.localeCompare(b.name)); // Tri alphabétique pour celles sans coordonnées

        // Si moins de 5 communes trouvées, ajouter des pharmacies sans coordonnées d'autres communes
        let additionalPharmaciesWithoutCoords = [];
        if (foundCommunes.length < 5) {
            const otherCommunes = [...new Set(pharmaciesWithoutCoords
                .filter(p => !foundCommunes.includes(p.commune))
                .map(p => p.commune))]
                .slice(0, 5 - foundCommunes.length);

            additionalPharmaciesWithoutCoords = pharmaciesWithoutCoords
                .filter(p => otherCommunes.includes(p.commune))
                .sort((a, b) => a.name.localeCompare(b.name));
        }

        // Combiner les résultats : pharmacies avec coordonnées (par distance) + pharmacies sans coordonnées (par nom)
        const result = [
            ...nearbyPharmacies,
            ...pharmaciesWithoutCoordsFromSameCommunes,
            ...additionalPharmaciesWithoutCoords
        ];

        // Obtenir les statistiques par commune pour la réponse
        const communeStats = {};
        result.forEach(pharmacy => {
            if (!communeStats[pharmacy.commune]) {
                communeStats[pharmacy.commune] = {
                    name: pharmacy.commune,
                    count: 0,
                    withCoordinates: 0,
                    withoutCoordinates: 0,
                    closestDistance: null
                };
            }
            communeStats[pharmacy.commune].count++;

            if (pharmacy.distance !== null) {
                communeStats[pharmacy.commune].withCoordinates++;
                if (communeStats[pharmacy.commune].closestDistance === null ||
                    pharmacy.distance < communeStats[pharmacy.commune].closestDistance) {
                    communeStats[pharmacy.commune].closestDistance = pharmacy.distance;
                }
            } else {
                communeStats[pharmacy.commune].withoutCoordinates++;
            }
        });

        const response = {
            userLocation: {
                latitude: userLat,
                longitude: userLng
            },
            searchRadius: radius,
            totalPharmacies: result.length,
            totalCommunes: Object.keys(communeStats).length,
            communes: Object.values(communeStats).sort((a, b) => {
                // Trier les communes par distance la plus proche (celles sans coordonnées à la fin)
                if (a.closestDistance === null && b.closestDistance === null) return 0;
                if (a.closestDistance === null) return 1;
                if (b.closestDistance === null) return -1;
                return a.closestDistance - b.closestDistance;
            }),
            pharmacies: result
        };

        logData.message = "Pharmacies à proximité récupérées avec succès";
        logData.status = "SUCCESS";
        logData.responseData = {
            totalPharmacies: result.length,
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