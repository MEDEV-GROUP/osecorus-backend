const express = require('express');
const router = express.Router();
const { Alert, sequelize } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');
const { Op } = require('sequelize');

router.get('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getAlertsByCommune",
        userId: req.user?.id || null,
        action: "Get Alerts by Commune",
        ipAddress: req.ip,
        requestData: null,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;

        if (user.role !== 'ADMIN') {
            logData.message = "Accès interdit : seuls les administrateurs peuvent effectuer cette action";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.unauthorized(res, logData.message);
        }

        // Extraction de la commune depuis l'adresse et comptage
        const communeStats = await Alert.findAll({
            attributes: [
                [sequelize.literal(`
                    SUBSTRING_INDEX(
                        SUBSTRING_INDEX(address, ',', -3),
                        ',',
                        1
                    )
                `), 'commune'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'total_alerts']
            ],
            where: {
                address: {
                    [Op.not]: null,
                    [Op.ne]: ''
                }
            },
            group: [sequelize.literal(`
                SUBSTRING_INDEX(
                    SUBSTRING_INDEX(address, ',', -3),
                    ',',
                    1
                )
            `)],
            order: [[sequelize.literal('total_alerts'), 'DESC']],
            raw: true
        });

        // Calculer le total des alertes
        const totalAlerts = communeStats.reduce((sum, stat) => sum + parseInt(stat.total_alerts), 0);

        // Calculer les pourcentages et identifier la commune la plus touchée
        const formattedStats = communeStats.map(stat => ({
            commune: stat.commune.trim(),
            total_alerts: parseInt(stat.total_alerts),
            percentage: ((parseInt(stat.total_alerts) / totalAlerts) * 100).toFixed(2)
        }));

        const mostAffectedCommune = formattedStats[0] || null;

        // Calculer la moyenne des alertes par commune
        const averageAlerts = totalAlerts / formattedStats.length;

        // Comparer la commune la plus touchée avec la moyenne
        const response = {
            mostAffectedCommune: mostAffectedCommune ? {
                ...mostAffectedCommune,
                comparisonToAverage: ((mostAffectedCommune.total_alerts / averageAlerts) * 100 - 100).toFixed(2)
            } : null,
            totalAlerts,
            averageAlertsPerCommune: averageAlerts.toFixed(2),
            allCommunes: formattedStats,
            totalCommunes: formattedStats.length
        };

        logData.message = "Statistiques des alertes par commune récupérées avec succès";
        logData.status = "SUCCESS";
        logData.responseData = response;
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, response);

    } catch (error) {
        logData.message = "Erreur lors de la récupération des statistiques par commune";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;