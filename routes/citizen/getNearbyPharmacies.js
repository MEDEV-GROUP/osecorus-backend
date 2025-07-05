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

        // Grouper les pharmacies par commune
        const pharmaciesByCommune = {};

        nearbyPharmacies.forEach(pharmacy => {
            if (!pharmaciesByCommune[pharmacy.commune]) {
                pharmaciesByCommune[pharmacy.commune] = [];
            }
            pharmaciesByCommune[pharmacy.commune].push(pharmacy);
        });

        pharmaciesWithoutCoords.forEach(pharmacy => {
            if (!pharmaciesByCommune[pharmacy.commune]) {
                pharmaciesByCommune[pharmacy.commune] = [];
            }
            pharmaciesByCommune[pharmacy.commune].push(pharmacy);
        });

        // Calculer la distance moyenne de chaque commune et trier
        const communesWithDistance = Object.keys(pharmaciesByCommune).map(commune => ({
            commune,
            averageDistance: calculateCommuneDistance(userLat, userLng, pharmaciesByCommune[commune]),
            pharmacies: pharmaciesByCommune[commune]
        }));

        // Trier les communes par distance moyenne
        communesWithDistance.sort((a, b) => a.averageDistance - b.averageDistance);

        // Prendre les 5 communes les plus proches
        const closestCommunes = communesWithDistance.slice(0, 5);

        // Construire la réponse finale
        const result = [];

        closestCommunes.forEach(communeData => {
            // Trier les pharmacies de chaque commune : avec coordonnées en premier (par distance), puis sans coordonnées
            const pharmaciesWithCoordsInCommune = communeData.pharmacies
                .filter(p => p.distance !== null)
                .sort((a, b) => a.distance - b.distance);

            const pharmaciesWithoutCoordsInCommune = communeData.pharmacies
                .filter(p => p.distance === null);

            result.push(...pharmaciesWithCoordsInCommune, ...pharmaciesWithoutCoordsInCommune);
        });

        const response = {
            userLocation: {
                latitude: userLat,
                longitude: userLng
            },
            searchRadius: radius,
            totalCommunes: closestCommunes.length,
            totalPharmacies: result.length,
            communes: closestCommunes.map(c => ({
                name: c.commune,
                averageDistance: c.averageDistance === 999999 ? null : parseFloat(c.averageDistance.toFixed(2)),
                pharmaciesCount: c.pharmacies.length
            })),
            pharmacies: result
        };

        logData.message = "Pharmacies à proximité récupérées avec succès";
        logData.status = "SUCCESS";
        logData.responseData = {
            totalPharmacies: result.length,
            totalCommunes: closestCommunes.length
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