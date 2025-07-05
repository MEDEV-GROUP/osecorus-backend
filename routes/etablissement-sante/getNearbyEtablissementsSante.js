const express = require('express');
const router = express.Router();
const { EtablissementSante } = require('../../models');
const { verifyRequestData } = require('../../config/utils');
const ApiResponse = require('../../utils/ApiResponse');
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

router.post('/', async (req, res) => {
    const logData = {
        message: "",
        source: "getNearbyEtablissementsSante",
        userId: req.user?.id || null,
        action: "Get Nearby Etablissements Sante",
        ipAddress: req.ip,
        requestData: req.body,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
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

        // Récupérer uniquement les hôpitaux et cliniques médicales actifs avec coordonnées GPS
        const etablissementsWithCoords = await EtablissementSante.findAll({
            where: {
                is_active: true,
                categorie: {
                    [Op.in]: ['Hôpital', 'Clinique médicale']
                },
                latitude: {
                    [Op.not]: null
                },
                longitude: {
                    [Op.not]: null
                }
            },
            order: [['nom_etablissement', 'ASC']]
        });

        // Calculer la distance pour chaque établissement
        const etablissementsWithDistance = etablissementsWithCoords.map(etablissement => {
            const distance = calculateDistance(
                userLat,
                userLng,
                parseFloat(etablissement.latitude),
                parseFloat(etablissement.longitude)
            );
            return {
                id: etablissement.id,
                nom: etablissement.nom_etablissement,
                categorie: etablissement.categorie,
                commune: etablissement.ville_commune,
                quartier: etablissement.quartier,
                coordinates: {
                    latitude: etablissement.latitude,
                    longitude: etablissement.longitude
                },
                distance: parseFloat(distance.toFixed(2))
            };
        });

        // Filtrer les établissements dans le rayon spécifié et trier par distance
        const nearbyEtablissements = etablissementsWithDistance
            .filter(e => e.distance <= radius)
            .sort((a, b) => a.distance - b.distance);

        // Obtenir les statistiques par commune pour la réponse
        const communeStats = {};
        nearbyEtablissements.forEach(etablissement => {
            if (!communeStats[etablissement.commune]) {
                communeStats[etablissement.commune] = {
                    name: etablissement.commune,
                    count: 0,
                    closestDistance: etablissement.distance
                };
            }
            communeStats[etablissement.commune].count++;

            // Mettre à jour la distance la plus proche pour cette commune
            if (etablissement.distance < communeStats[etablissement.commune].closestDistance) {
                communeStats[etablissement.commune].closestDistance = etablissement.distance;
            }
        });

        // Statistiques par catégorie
        const categorieStats = {};
        nearbyEtablissements.forEach(etablissement => {
            if (!categorieStats[etablissement.categorie]) {
                categorieStats[etablissement.categorie] = {
                    name: etablissement.categorie,
                    count: 0,
                    closestDistance: etablissement.distance
                };
            }
            categorieStats[etablissement.categorie].count++;

            if (etablissement.distance < categorieStats[etablissement.categorie].closestDistance) {
                categorieStats[etablissement.categorie].closestDistance = etablissement.distance;
            }
        });

        const response = {
            userLocation: {
                latitude: userLat,
                longitude: userLng
            },
            searchRadius: radius,
            totalEtablissements: nearbyEtablissements.length,
            totalCommunes: Object.keys(communeStats).length,
            statistics: {
                parCommune: Object.values(communeStats).sort((a, b) => a.closestDistance - b.closestDistance),
                parCategorie: Object.values(categorieStats).sort((a, b) => a.closestDistance - b.closestDistance)
            },
            etablissements: nearbyEtablissements
        };

        logData.message = "Établissements de santé à proximité récupérés avec succès";
        logData.status = "SUCCESS";
        logData.responseData = {
            totalEtablissements: nearbyEtablissements.length,
            totalCommunes: Object.keys(communeStats).length
        };
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, response);

    } catch (error) {
        logData.message = "Erreur lors de la récupération des établissements de santé à proximité";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;