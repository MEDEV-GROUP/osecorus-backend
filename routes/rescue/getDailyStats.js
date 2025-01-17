// routes/rescue/dailyStats.js
const express = require('express');
const router = express.Router();
const { Intervention, RescueMember } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');
const { Op } = require('sequelize');

router.get('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getDailyStats",
        userId: req.user?.id || null,
        action: "Get Daily Intervention Stats",
        ipAddress: req.ip,
        requestData: null,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;

        // Vérification que l'utilisateur est un membre de secours
        if (user.role !== 'RESCUE_MEMBER') {
            logData.message = "Accès interdit : seuls les membres de secours peuvent effectuer cette action";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.unauthorized(res, logData.message);
        }

        // Récupération du rescue member
        const rescueMember = await RescueMember.findOne({
            where: { user_id: user.id }
        });

        if (!rescueMember) {
            logData.message = "Membre de secours non trouvé";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message);
        }

        // Obtenir le début et la fin de la journée
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        // Compter les interventions du jour
        const totalInterventions = await Intervention.count({
            where: {
                rescue_member_id: rescueMember.id,
                created_at: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            }
        });

        // Compter les interventions annulées
        const cancelledInterventions = await Intervention.count({
            where: {
                rescue_member_id: rescueMember.id,
                status: 'ANNULEE',
                created_at: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            }
        });

        const response = {
            totalInterventions,
            cancelledInterventions,
            date: startOfDay.toISOString().split('T')[0]
        };

        logData.message = "Statistiques quotidiennes récupérées avec succès";
        logData.status = "SUCCESS";
        logData.responseData = response;
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, response);

    } catch (error) {
        logData.message = "Erreur lors de la récupération des statistiques quotidiennes";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;