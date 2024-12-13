const express = require('express');
const router = express.Router();
const { RescueService } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse'); // Classe pour les réponses API
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs

// Route pour récupérer tous les services de secours
router.get('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getRescueServices",
        userId: req.user?.id || null,
        action: "Retrieve Rescue Services",
        ipAddress: req.ip,
        requestData: null,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    const { user } = req;
    if (user.role !== 'ADMIN') {
        logData.message = "Accès interdit : seuls les administrateurs peuvent effectuer cette action";
        logData.status = "FAILED";
        await Logger.logEvent(logData);

        return ApiResponse.unauthorized(res, logData.message);
    }

    try {
        // Récupérer tous les services actifs ou inactifs selon les besoins
        const rescueServices = await RescueService.findAll();

        if (rescueServices.length === 0) {
            logData.message = "Aucun service de secours trouvé";
            logData.status = "SUCCESS";
            logData.responseData = [];
            await Logger.logEvent(logData);

            return ApiResponse.success(res, logData.message, []);
        }

        // Formater les données si nécessaire
        const formattedServices = rescueServices.map(service => ({
            id: service.id,
            name: service.name,
            serviceType: service.service_type,
            contactNumber: service.contact_number,
            description: service.description,
            isActive: service.is_active
        }));

        logData.message = "Liste des services de secours récupérée avec succès";
        logData.status = "SUCCESS";
        logData.responseData = formattedServices;
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, formattedServices);
    } catch (error) {
        logData.message = "Erreur lors de la récupération des services de secours";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;
