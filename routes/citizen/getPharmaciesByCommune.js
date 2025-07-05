const express = require('express');
const router = express.Router();
const { Pharmacy } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');

router.get('/:commune', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "getPharmaciesByCommune",
        userId: req.user?.id || null,
        action: "Get Pharmacies by Commune",
        ipAddress: req.ip,
        requestData: { commune: req.params.commune },
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;

        // Vérification que l'utilisateur est un citoyen
        if (user.role !== 'CITIZEN') {
            logData.message = "Accès interdit : seuls les citoyens peuvent effectuer cette action";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.unauthorized(res, logData.message);
        }

        const { commune } = req.params;

        // Récupérer toutes les pharmacies de la commune
        const pharmacies = await Pharmacy.findAll({
            where: {
                commune: commune,
                is_active: true
            }
        });

        if (!pharmacies || pharmacies.length === 0) {
            logData.message = "Aucune pharmacie trouvée pour cette commune";
            logData.status = "SUCCESS";
            logData.responseData = { commune, total: 0 };
            await Logger.logEvent(logData);

            return ApiResponse.success(res, logData.message, {
                commune,
                total: 0,
                pharmaciesWithLocation: 0,
                pharmaciesWithoutLocation: 0,
                pharmacies: []
            });
        }

        // Séparer les pharmacies avec et sans coordonnées
        const pharmaciesWithLocation = pharmacies.filter(p => p.latitude && p.longitude);
        const pharmaciesWithoutLocation = pharmacies.filter(p => !p.latitude || !p.longitude);

        // Trier : d'abord celles avec localisation (par nom), puis celles sans localisation (par nom)
        pharmaciesWithLocation.sort((a, b) => a.name.localeCompare(b.name));
        pharmaciesWithoutLocation.sort((a, b) => a.name.localeCompare(b.name));

        // Combiner les résultats : avec localisation en premier, puis sans localisation
        const sortedPharmacies = [
            ...pharmaciesWithLocation.map(p => ({ ...p.toJSON(), hasLocation: true })),
            ...pharmaciesWithoutLocation.map(p => ({ ...p.toJSON(), hasLocation: false }))
        ];

        const response = {
            commune,
            total: pharmacies.length,
            pharmaciesWithLocation: pharmaciesWithLocation.length,
            pharmaciesWithoutLocation: pharmaciesWithoutLocation.length,
            pharmacies: sortedPharmacies
        };

        logData.message = "Pharmacies par commune récupérées avec succès";
        logData.status = "SUCCESS";
        logData.responseData = {
            commune,
            total: pharmacies.length,
            withLocation: pharmaciesWithLocation.length,
            withoutLocation: pharmaciesWithoutLocation.length
        };
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, response);

    } catch (error) {
        logData.message = "Erreur lors de la récupération des pharmacies par commune";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;