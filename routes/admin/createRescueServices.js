const express = require('express');
const router = express.Router();
const { RescueService } = require('../../models');
const { verifyRequestData } = require('../../config/utils');
const ApiResponse = require('../../utils/ApiResponse'); // Classe pour les réponses API
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification

// Middleware pour sécuriser la route et vérifier le rôle d'administrateur
router.post('/', authenticate(), async (req, res) => {
  // Vérification du rôle de l'utilisateur authentifié
  const { user } = req;
  if (user.role !== 'ADMIN') {
    return ApiResponse.unauthorized(res, "Accès interdit : seuls les administrateurs peuvent effectuer cette action");
  }

  const requiredFields = ['name', 'service_type', 'contact_number', 'description'];
  const verify = verifyRequestData(req.body, requiredFields);

  if (!verify.isValid) {
    return ApiResponse.badRequest(res, 'Champs requis manquants', {
      missingFields: verify.missingFields
    });
  }

  try {
    const { name, service_type, contact_number, description } = req.body;

    // Vérifier si un service de secours avec le même nom existe déjà
    const existingService = await RescueService.findOne({ where: { name } });
    if (existingService) {
      return ApiResponse.badRequest(res, 'Un service de secours avec ce nom existe déjà');
    }

    // Création du service de secours
    const rescueService = await RescueService.create({
      name,
      service_type,
      contact_number,
      description,
      is_active: true
    });

    return ApiResponse.created(res, 'Service de secours créé avec succès', {
      id: rescueService.id,
      name: rescueService.name,
      serviceType: rescueService.service_type,
      contactNumber: rescueService.contact_number,
      description: rescueService.description,
      isActive: rescueService.is_active
    });
  } catch (error) {
    return ApiResponse.serverError(res, 'Erreur lors de la création du service de secours', error.message);
  }
});

module.exports = router;
