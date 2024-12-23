const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Alert } = require('../../models');
const { authenticate } = require('../../middlewares/authenticate');
const ApiResponse = require('../../utils/ApiResponse');
const Logger = require('../../utils/Logger');

// Fonction utilitaire pour calculer les variations en pourcentage
const calculatePercentageVariation = (current, previous) => {
    if (previous === 0) {
        return { variation: 100, variation_type: current > 0 ? 'increase' : 'none' };
    }
    const diff = current - previous;
    const percentage = Math.round((diff / previous) * 100);
    const variation_type = diff > 0 ? 'increase' : diff < 0 ? 'decrease' : 'none';
    return { variation: Math.abs(percentage), variation_type };
};

// Fonction utilitaire pour regrouper les alertes par catégorie
const groupByCategory = (alerts) => {
    return alerts.reduce((acc, alert) => {
        acc[alert.category] = (acc[alert.category] || 0) + 1;
        return acc;
    }, {});
};

// Fonction utilitaire pour extraire la commune d'une adresse
const extractCommune = (address) => {
    if (!address) return 'Unknown';
    const parts = address.split(',');
    return parts.length >= 3 ? parts[parts.length - 3].trim() : 'Unknown';
};

// Fonction pour calculer les périodes
const getPeriods = (referenceDate = new Date()) => {
    const date = new Date(referenceDate);

    // Jour en cours
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    // Jour précédent
    const startOfYesterday = new Date(startOfDay);
    startOfYesterday.setDate(startOfDay.getDate() - 1);
    const endOfYesterday = new Date(startOfYesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    // Semaine en cours
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Lundi de la semaine
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche de la semaine
    endOfWeek.setHours(23, 59, 59, 999);

    // Semaine précédente
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
    endOfLastWeek.setHours(23, 59, 59, 999);

    // Mois en cours
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(startOfMonth.getMonth() + 1);
    endOfMonth.setDate(0); // Dernier jour du mois
    endOfMonth.setHours(23, 59, 59, 999);

    // Mois précédent
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfMonth.getMonth() - 1);
    const endOfLastMonth = new Date(startOfLastMonth);
    endOfLastMonth.setMonth(startOfLastMonth.getMonth() + 1);
    endOfLastMonth.setDate(0); // Dernier jour du mois précédent
    endOfLastMonth.setHours(23, 59, 59, 999);

    return {
        currentDay: { start: startOfDay, end: endOfDay },
        yesterday: { start: startOfYesterday, end: endOfYesterday },
        currentWeek: { start: startOfWeek, end: endOfWeek },
        lastWeek: { start: startOfLastWeek, end: endOfLastWeek },
        currentMonth: { start: startOfMonth, end: endOfMonth },
        lastMonth: { start: startOfLastMonth, end: endOfLastMonth },
    };
};

// Route principale pour le tableau de bord
router.get('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getDashboard",
        userId: req.user?.id || null,
        action: "Get Dashboard Data",
        ipAddress: req.ip,
        requestData: req.query || null,
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

        // Calculer les périodes en fonction de la date actuelle ou future
        const referenceDate = req.query.date ? new Date(req.query.date) : new Date();
        const { currentDay, yesterday, currentWeek, lastWeek, currentMonth, lastMonth } = getPeriods(referenceDate);

        // Récupérer les données par période
        const alertsToday = await Alert.findAll({ where: { createdAt: { [Op.between]: [currentDay.start, currentDay.end] } } });
        const alertsYesterday = await Alert.findAll({ where: { createdAt: { [Op.between]: [yesterday.start, yesterday.end] } } });
        const alertsThisWeek = await Alert.findAll({ where: { createdAt: { [Op.between]: [currentWeek.start, currentWeek.end] } } });
        const alertsLastWeek = await Alert.findAll({ where: { createdAt: { [Op.between]: [lastWeek.start, lastWeek.end] } } });
        const alertsThisMonth = await Alert.findAll({ where: { createdAt: { [Op.between]: [currentMonth.start, currentMonth.end] } } });
        const alertsLastMonth = await Alert.findAll({ where: { createdAt: { [Op.between]: [lastMonth.start, lastMonth.end] } } });

        // Regrouper les alertes par catégorie
        const dailyBreakdown = groupByCategory(alertsToday);
        const yesterdayBreakdown = groupByCategory(alertsYesterday);
        const weeklyBreakdown = groupByCategory(alertsThisWeek);
        const lastWeekBreakdown = groupByCategory(alertsLastWeek);
        const monthlyBreakdown = groupByCategory(alertsThisMonth);
        const lastMonthBreakdown = groupByCategory(alertsLastMonth);

        // Construire la réponse avec les variations pour chaque type
        const buildBreakdown = (currentBreakdown, previousBreakdown) => {
            return Object.keys(currentBreakdown).reduce((acc, key) => {
                const { variation, variation_type } = calculatePercentageVariation(
                    currentBreakdown[key],
                    previousBreakdown[key] || 0
                );
                acc[key.toLowerCase()] = {
                    count: currentBreakdown[key],
                    variation,
                    variation_type,
                };
                return acc;
            }, {});
        };

        const dailyData = buildBreakdown(dailyBreakdown, yesterdayBreakdown);
        const weeklyData = buildBreakdown(weeklyBreakdown, lastWeekBreakdown);
        const monthlyData = buildBreakdown(monthlyBreakdown, lastMonthBreakdown);

        // Récupérer les données par commune
        const communesMonthly = alertsThisMonth.reduce((acc, alert) => {
            const commune = extractCommune(alert.address || '');
            if (!acc[commune]) acc[commune] = 0;
            acc[commune]++;
            return acc;
        }, {});

        const communesData = Object.keys(communesMonthly).map((commune) => ({
            name: commune,
            monthly_incidents: [
                { month: referenceDate.toLocaleString('default', { month: 'short' }), count: communesMonthly[commune] }
            ],
        }));

        // Construire la réponse finale
        const response = {
            dashboard: {
                statistics: {
                    daily: {
                        total: alertsToday.length,
                        breakdown: dailyData,
                        start_date: currentDay.start.toISOString(),
                        end_date: currentDay.end.toISOString(),
                    },
                    weekly: {
                        total: alertsThisWeek.length,
                        breakdown: weeklyData,
                        start_date: currentWeek.start.toISOString(),
                        end_date: currentWeek.end.toISOString(),
                    },
                    monthly: {
                        total: alertsThisMonth.length,
                        breakdown: monthlyData,
                        start_date: currentMonth.start.toISOString(),
                        end_date: currentMonth.end.toISOString(),
                    },
                },
                communes: {
                    data: communesData,
                },
            },
        };

        logData.message = "Données du tableau de bord récupérées avec succès";
        logData.status = "SUCCESS";
        logData.responseData = response;
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, response);
    } catch (error) {
        logData.message = "Erreur lors de la récupération des données du tableau de bord";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;
