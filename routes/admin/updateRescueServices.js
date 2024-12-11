const express = require('express');
const router = express.Router();
const { RescueService } = require('../../models');
const { verifyRequestDataForUpdate } = require('../../config/utils'); // Utilitaire pour vérifier les champs autorisés
const ApiResponse = require('../../utils/ApiResponse'); // Classe pour les réponses API
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification

// Route pour modifier un service
router.put('/:id', authenticate(), async (req, res) => {
  // Vérification du rôle de l'utilisateur
  const { user } = req;
  if (user.role !== 'ADMIN') {
    return ApiResponse.unauthorized(res, "Accès interdit : seuls les administrateurs peuvent effectuer cette action");
  }

  const { id } = req.params;
  const allowedFields = ['name', 'service_type', 'contact_number', 'description', 'is_active'];

  // Vérification des champs autorisés pour la mise à jour
  const verify = verifyRequestDataForUpdate(req.body, allowedFields);
  if (!verify.isValid) {
    return ApiResponse.badRequest(res, 'Certains champs ne sont pas autorisés pour la mise à jour', {
      invalidFields: verify.invalidFields
    });
  }

  try {
    // Rechercher le service à modifier
    const rescueService = await RescueService.findByPk(id);
    if (!rescueService) {
      return ApiResponse.badRequest(res, "Service de secours introuvable");
    }

    // Mettre à jour les champs
    const updatedService = await rescueService.update(req.body);

    return ApiResponse.success(res, "Service de secours mis à jour avec succès", {
      id: updatedService.id,
      name: updatedService.name,
      serviceType: updatedService.service_type,
      contactNumber: updatedService.contact_number,
      description: updatedService.description,
      isActive: updatedService.is_active
    });
  } catch (error) {
    return ApiResponse.serverError(res, "Erreur lors de la mise à jour du service de secours", error.message);
  }
});

module.exports = router;
