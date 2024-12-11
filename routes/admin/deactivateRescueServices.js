const express = require('express');
const router = express.Router();
const { RescueService } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse'); // Classe pour les réponses API
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification

// Route pour désactiver un service
router.patch('/:id', authenticate(), async (req, res) => {
  // Vérification du rôle de l'utilisateur
  const { user } = req;
  if (user.role !== 'ADMIN') {
    return ApiResponse.unauthorized(res, "Accès interdit : seuls les administrateurs peuvent effectuer cette action");
  }

  const { id } = req.params;

  try {
    // Rechercher le service par ID
    const rescueService = await RescueService.findByPk(id);

    if (!rescueService) {
      return ApiResponse.badRequest(res, "Service de secours introuvable");
    }

    if (!rescueService.is_active) {
      return ApiResponse.badRequest(res, "Ce service est déjà désactivé");
    }

    // Désactiver le service
    rescueService.is_active = false;
    await rescueService.save();

    return ApiResponse.success(res, "Service de secours désactivé avec succès", {
      id: rescueService.id,
      name: rescueService.name,
      isActive: rescueService.is_active
    });
  } catch (error) {
    return ApiResponse.serverError(res, "Erreur lors de la désactivation du service de secours", error.message);
  }
});

module.exports = router;
