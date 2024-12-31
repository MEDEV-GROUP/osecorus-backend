const express = require('express');
const router = express.Router();
const { User, Token } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');
const { Op } = require('sequelize');

router.get('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getActiveUsers",
        userId: req.user?.id || null,
        action: "Get Active Users Stats",
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

        // Compter les utilisateurs avec des tokens valides
        const activeUsersCount = await User.count({
            where: {
                role: 'CITIZEN',
                is_active: true
            },
            include: [{
                model: Token,
                as: 'tokens',
                where: {
                    is_revoked: false,
                    expires_at: {
                        [Op.gt]: new Date()
                    }
                },
                required: true
            }]
        });

        // Obtenir le nombre total d'utilisateurs citoyens
        const totalUsers = await User.count({
            where: {
                role: 'CITIZEN'
            }
        });

        // Obtenir le nombre d'utilisateurs actifs (is_active = true)
        const activatedUsers = await User.count({
            where: {
                role: 'CITIZEN',
                is_active: true
            }
        });

        const response = {
            totalRegisteredUsers: totalUsers,
            activatedUsers: activatedUsers,
            activeUsersWithValidToken: activeUsersCount,
            statistics: {
                activationRate: totalUsers > 0 ? ((activatedUsers / totalUsers) * 100).toFixed(2) : 0,
                activeTokenRate: activatedUsers > 0 ? ((activeUsersCount / activatedUsers) * 100).toFixed(2) : 0,
                overallActiveRate: totalUsers > 0 ? ((activeUsersCount / totalUsers) * 100).toFixed(2) : 0
            }
        };

        logData.message = "Statistiques des utilisateurs actifs récupérées avec succès";
        logData.status = "SUCCESS";
        logData.responseData = response;
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, response);

    } catch (error) {
        logData.message = "Erreur lors de la récupération des statistiques des utilisateurs actifs";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;