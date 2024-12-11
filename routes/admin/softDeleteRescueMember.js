const express = require('express');
const router = express.Router();
const { User, RescueMember } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse'); // Réponses standardisées
const { authenticate } = require('../../middlewares/authenticate');

// Route pour désactiver un membre de secours (soft delete)
router.patch('/:id', authenticate(), async (req, res) => {
  const { user } = req;

  // Vérification du rôle d'administrateur
  if (user.role !== 'ADMIN') {
    return ApiResponse.unauthorized(res, "Accès interdit : seuls les administrateurs peuvent effectuer cette action");
  }

  const { id } = req.params;

  try {
    // Rechercher le membre de secours
    const rescueMember = await RescueMember.findByPk(id, {
      include: {
        model: User,
        as: 'user' // Spécifiez l'alias ici
      }
    });
    console.log(rescueMember.user);

    if (!rescueMember) {
      return ApiResponse.badRequest(res, "Membre de secours introuvable");
    }

    if (!rescueMember.user.is_active) {
      return ApiResponse.badRequest(res, "Ce membre est déjà désactivé");
    }

    // Désactiver l'utilisateur associé
    await rescueMember.user.update({ is_active: false });

    return ApiResponse.success(res, "Membre de secours désactivé avec succès", {
      id: rescueMember.id,
      user: {
        id: rescueMember.user.id,
        firstName: rescueMember.user.first_name,
        lastName: rescueMember.user.last_name,
        isActive: false
      }
    });
  } catch (error) {
    return ApiResponse.serverError(res, "Erreur lors de la désactivation du membre de secours", error.message);
  }
});

module.exports = router;
