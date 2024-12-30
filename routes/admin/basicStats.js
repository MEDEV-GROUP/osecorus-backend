const express = require('express');
const router = express.Router();
const { Alert, Intervention } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');
const { Op } = require('sequelize');

router.get('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getBasicStats",
        userId: req.user?.id || null,
        action: "Get Basic Statistics",
        ipAddress: req.ip,
        requestData: null,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;

        // Vérification du rôle de l'utilisateur
        if (user.role !== 'ADMIN') {
            logData.message = "Accès interdit : seuls les administrateurs peuvent effectuer cette action";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.unauthorized(res, logData.message);
        }

        // Obtenir le nombre total d'alertes
        const totalAlerts = await Alert.count();

        // Obtenir le nombre total d'interventions
        const totalInterventions = await Intervention.count({
            where: {
                status: {
                    [Op.notIn]: ['ANNULEE']  // Exclure les interventions annulées
                }
            }
        });

        const response = {
            totalAlerts,
            totalInterventions,
            interventionRate: totalAlerts > 0 
                ? ((totalInterventions / totalAlerts) * 100).toFixed(2) 
                : 0
        };

        logData.message = "Statistiques de base récupérées avec succès";
        logData.status = "SUCCESS";
        logData.responseData = response;
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, response);

    } catch (error) {
        logData.message = "Erreur lors de la récupération des statistiques de base";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;