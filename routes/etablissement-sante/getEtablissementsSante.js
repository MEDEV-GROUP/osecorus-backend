const express = require('express');
const router = express.Router();
const { EtablissementSante } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const Logger = require('../../utils/Logger');

// Route pour récupérer tous les établissements de santé avec pagination
router.get('/', async (req, res) => {
    const logData = {
        message: "",
        source: "getEtablissementsSante",
        userId: req.user?.id || null,
        action: "Get Etablissements Sante",
        ipAddress: req.ip,
        requestData: req.query || null,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        // Paramètres de pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Clause WHERE simple - seulement les établissements actifs
        const whereClause = {
            is_active: true
        };

        // Récupérer le nombre total d'établissements pour la pagination
        const totalEtablissements = await EtablissementSante.count({
            where: whereClause
        });

        // Récupérer les établissements avec pagination
        const etablissements = await EtablissementSante.findAll({
            where: whereClause,
            attributes: ['id', 'nom_etablissement', 'categorie', 'ville_commune', 'quartier', 'latitude', 'longitude'],
            limit: limit,
            offset: offset,
            order: [['ville_commune', 'ASC'], ['nom_etablissement', 'ASC']]
        });

        // Formater les données de réponse
        const formattedEtablissements = etablissements.map(etablissement => ({
            id: etablissement.id,
            nom: etablissement.nom_etablissement,
            categorie: etablissement.categorie,
            commune: etablissement.ville_commune,
            quartier: etablissement.quartier,
            coordinates: {
                latitude: etablissement.latitude,
                longitude: etablissement.longitude
            }
        }));

        // Métadonnées de pagination
        const pagination = {
            currentPage: page,
            itemsPerPage: limit,
            totalItems: totalEtablissements,
            totalPages: Math.ceil(totalEtablissements / limit),
            hasNextPage: page < Math.ceil(totalEtablissements / limit),
            hasPreviousPage: page > 1
        };

        // Réponse simplifiée
        const response = {
            pagination,
            etablissements: formattedEtablissements
        };

        logData.message = "Établissements de santé récupérés avec succès";
        logData.status = "SUCCESS";
        logData.responseData = {
            count: formattedEtablissements.length,
            totalEtablissements: totalEtablissements
        };
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, response);

    } catch (error) {
        logData.message = "Erreur lors de la récupération des établissements de santé";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;