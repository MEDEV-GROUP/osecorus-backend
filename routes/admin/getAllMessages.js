const express = require('express');
const router = express.Router();
const { AdminMessage, User } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');

router.get('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "fetchAdminMessages",
        userId: req.user?.id || null,
        action: "Fetch Messages",
        ipAddress: req.ip,
        requestData: req.query,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        // Vérification du rôle de l'utilisateur
        const { user } = req;
        if (user.role !== 'ADMIN') {
            logData.message = "Accès interdit : seuls les administrateurs peuvent consulter les messages";
            logData.status = "FAILED";
            await Logger.logEvent(logData);

            return ApiResponse.unauthorized(res, logData.message);
        }

        // Récupérer tous les messages
        const messages = await AdminMessage.findAll({
            include: [
                {
                    model: User,
                    as: 'admin',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                }
            ],
            order: [['created_at', 'DESC']] // Tri par date de création (les plus récents en premier)
        });

        logData.message = "Messages récupérés avec succès";
        logData.status = "SUCCESS";
        logData.responseData = messages;
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, messages);
    } catch (error) {
        logData.message = "Erreur lors de la récupération des messages";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;
