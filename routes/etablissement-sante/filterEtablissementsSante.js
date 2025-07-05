const express = require('express');
const router = express.Router();
const { EtablissementSante } = require('../../models');
const { Op } = require('sequelize');
const ApiResponse = require('../../utils/ApiResponse');
const Logger = require('../../utils/Logger');

// Route pour filtrer les établissements de santé par commune ou catégorie
router.get('/', async (req, res) => {
    const logData = {
        message: "",
        source: "filterEtablissementsSante",
        userId: req.user?.id || null,
        action: "Filter Etablissements Sante",
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

        // Clause WHERE de base
        const whereClause = {
            is_active: true
        };

        // Filtre par commune si spécifié
        if (req.query.commune) {
            whereClause.ville_commune = {
                [Op.iLike]: `%${req.query.commune}%`
            };
        }

        // Filtre par catégorie si spécifié
        if (req.query.categorie) {
            whereClause.categorie = req.query.categorie;
        }

        // Vérifier qu'au moins un filtre est appliqué
        if (!req.query.commune && !req.query.categorie) {
            logData.message = "Au moins un filtre (commune ou catégorie) doit être spécifié";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message);
        }

        // Récupérer le nombre total d'établissements correspondant aux filtres
        const totalEtablissements = await EtablissementSante.count({
            where: whereClause
        });

        // Récupérer les établissements avec pagination
        const etablissements = await EtablissementSante.findAll({
            where: whereClause,
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
            },
            isActive: etablissement.is_active,
            createdAt: etablissement.createdAt,
            updatedAt: etablissement.updatedAt
        }));

        // Statistiques détaillées par catégorie pour les résultats filtrés
        const categorieStats = await EtablissementSante.findAll({
            where: whereClause,
            attributes: [
                'categorie',
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
            ],
            group: ['categorie'],
            order: [['categorie', 'ASC']]
        });

        // Statistiques détaillées par commune pour les résultats filtrés
        const communeStats = await EtablissementSante.findAll({
            where: whereClause,
            attributes: [
                'ville_commune',
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
            ],
            group: ['ville_commune'],
            order: [['ville_commune', 'ASC']]
        });

        // Métadonnées de pagination
        const pagination = {
            currentPage: page,
            itemsPerPage: limit,
            totalItems: totalEtablissements,
            totalPages: Math.ceil(totalEtablissements / limit),
            hasNextPage: page < Math.ceil(totalEtablissements / limit),
            hasPreviousPage: page > 1,
            nextPage: page < Math.ceil(totalEtablissements / limit) ? page + 1 : null,
            previousPage: page > 1 ? page - 1 : null
        };

        // Réponse structurée
        const response = {
            pagination,
            filtresAppliques: {
                commune: req.query.commune || null,
                categorie: req.query.categorie || null
            },
            statistics: {
                totalCorrespondant: totalEtablissements,
                parCategorie: categorieStats.map(stat => ({
                    categorie: stat.categorie,
                    count: parseInt(stat.dataValues.count)
                })),
                parCommune: communeStats.map(stat => ({
                    commune: stat.ville_commune,
                    count: parseInt(stat.dataValues.count)
                }))
            },
            etablissements: formattedEtablissements
        };

        logData.message = "Établissements de santé filtrés récupérés avec succès";
        logData.status = "SUCCESS";
        logData.responseData = {
            pagination,
            filtresAppliques: response.filtresAppliques,
            count: formattedEtablissements.length,
            totalEtablissements: totalEtablissements
        };
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, response);

    } catch (error) {
        logData.message = "Erreur lors du filtrage des établissements de santé";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;