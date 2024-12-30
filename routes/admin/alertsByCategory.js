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
        source: "getAlertsByCategory",
        userId: req.user?.id || null,
        action: "Get Yearly Alerts by Category",
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

        // Obtenir les dates de début et fin de l'année en cours
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 0, 1); // 1er janvier
        const endDate = new Date(currentYear, 11, 31, 23, 59, 59); // 31 décembre

        // Obtenir les alertes par catégorie pour l'année en cours
        const alertsByCategory = await Alert.findAll({
            attributes: [
                'category',
                [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
                [sequelize.fn('MONTH', sequelize.col('created_at')), 'month'],
                [sequelize.fn('YEAR', sequelize.col('created_at')), 'year']
            ],
            where: {
                created_at: {
                    [Op.between]: [startDate, endDate]
                }
            },
            group: ['category', 
                   sequelize.fn('MONTH', sequelize.col('created_at')),
                   sequelize.fn('YEAR', sequelize.col('created_at'))],
            order: [
                [sequelize.fn('MONTH', sequelize.col('created_at')), 'ASC']
            ],
            raw: true
        });

        // Formater les données pour obtenir un tableau par mois
        const months = {};
        const categories = ['Accidents', 'Incendies', 'Inondations', 'Malaises', 'Noyade', 'Autre'];
        
        alertsByCategory.forEach(alert => {
            const monthNum = alert.month.toString().padStart(2, '0');
            const monthKey = `${alert.year}-${monthNum}`;
            
            if (!months[monthKey]) {
                months[monthKey] = {
                    month: monthKey,
                    total: 0
                };
                // Initialiser chaque catégorie à 0
                categories.forEach(category => {
                    months[monthKey][category] = 0;
                });
            }
            months[monthKey][alert.category] = parseInt(alert.total);
            months[monthKey].total += parseInt(alert.total);
        });

        // S'assurer que tous les mois de l'année sont présents
        for (let i = 1; i <= 12; i++) {
            const monthNum = i.toString().padStart(2, '0');
            const monthKey = `${currentYear}-${monthNum}`;
            if (!months[monthKey]) {
                months[monthKey] = {
                    month: monthKey,
                    total: 0
                };
                categories.forEach(category => {
                    months[monthKey][category] = 0;
                });
            }
        }

        const response = {
            year: currentYear,
            monthlyData: Object.values(months).sort((a, b) => a.month.localeCompare(b.month)),
            categories: categories,
            // Ajouter les totaux par catégorie
            totalsByCategory: categories.reduce((acc, category) => {
                acc[category] = Object.values(months).reduce((sum, month) => sum + (month[category] || 0), 0);
                return acc;
            }, {}),
            // Total général
            grandTotal: Object.values(months).reduce((sum, month) => sum + month.total, 0)
        };

        logData.message = "Statistiques des alertes par catégorie récupérées avec succès";
        logData.status = "SUCCESS";
        logData.responseData = response;
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, response);

    } catch (error) {
        logData.message = "Erreur lors de la récupération des statistiques des alertes";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;