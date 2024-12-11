const express = require('express');
const router = express.Router();
const { RescueService } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse'); // Classe pour les réponses API
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification

// Route pour récupérer tous les services de secours
router.get('/', authenticate(), async (req, res) => {
    const { user } = req;
    if (user.role !== 'ADMIN') {
        return ApiResponse.unauthorized(res, "Accès interdit : seuls les administrateurs peuvent effectuer cette action");
    }
    
    try {
        // Récupérer tous les services actifs ou inactifs selon les besoins
        const rescueServices = await RescueService.findAll();

        if (rescueServices.length === 0) {
            return ApiResponse.success(res, "Aucun service de secours trouvé", []);
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

        return ApiResponse.success(res, "Liste des services de secours récupérée avec succès", formattedServices);
    } catch (error) {
        return ApiResponse.serverError(res, "Erreur lors de la récupération des services de secours", error.message);
    }
});

module.exports = router;
