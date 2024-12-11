const express = require('express');
const router = express.Router();
const { User, RescueMember, RescueService } = require('../../models');
const { verifyRequestDataForUpdate } = require('../../config/utils');
const ApiResponse = require('../../utils/ApiResponse'); // Réponses standardisées
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification

// Route pour modifier un membre de secours
router.put('/:id', authenticate(), async (req, res) => {
    const { user } = req;
  
    // Vérification du rôle d'administrateur
    if (user.role !== 'ADMIN') {
      return ApiResponse.unauthorized(res, "Accès interdit : seuls les administrateurs peuvent effectuer cette action");
    }
  
    const { id } = req.params;
    const allowedFields = [
      "firstName",
      "lastName",
      "phoneNumber",
      "position",
      "badgeNumber",
      "rescueServiceId",
      "isActive"
    ];
  
    // Vérification des champs modifiables
    const verify = verifyRequestDataForUpdate(req.body, allowedFields);
    if (!verify.isValid) {
      return ApiResponse.badRequest(res, "Certains champs ne sont pas autorisés pour la mise à jour", {
        invalidFields: verify.invalidFields
      });
    }
  
    try {
      const rescueMember = await RescueMember.findByPk(id, {
        include: {
          model: User,
          as: 'user' // Alias exact défini dans le modèle
        }
      });
  
      if (!rescueMember) {
        return ApiResponse.badRequest(res, "Membre de secours introuvable");
      }
  
      if (!rescueMember.user) {
        return ApiResponse.badRequest(res, "Aucun utilisateur associé à ce membre de secours");
      }
  
      const { firstName, lastName, phoneNumber, badgeNumber, rescueServiceId, position, isActive } = req.body;
  
      // Mettre à jour les données utilisateur si présentes
      const userUpdates = {};
      if (firstName) userUpdates.first_name = firstName;
      if (lastName) userUpdates.last_name = lastName;
      if (phoneNumber) userUpdates.phone_number = phoneNumber;
  
      if (Object.keys(userUpdates).length > 0) {
        await rescueMember.user.update(userUpdates);
      }
  
      // Mettre à jour les données du membre de secours si présentes
      const memberUpdates = {};
      if (badgeNumber) memberUpdates.badge_number = badgeNumber;
      if (rescueServiceId) memberUpdates.rescue_service_id = rescueServiceId;
      if (position) memberUpdates.position = position;
      if (isActive !== undefined) memberUpdates.is_on_duty = isActive;
  
      if (Object.keys(memberUpdates).length > 0) {
        await rescueMember.update(memberUpdates);
      }
  
      return ApiResponse.success(res, "Membre de secours mis à jour avec succès", {
        id: rescueMember.id,
        user: {
          id: rescueMember.user.id,
          firstName: rescueMember.user.first_name,
          lastName: rescueMember.user.last_name,
          phoneNumber: rescueMember.user.phone_number
        },
        badgeNumber: rescueMember.badge_number,
        position: rescueMember.position,
        rescueServiceId: rescueMember.rescue_service_id,
        isActive: rescueMember.is_on_duty
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du membre de secours:', error.message);
      return ApiResponse.serverError(res, "Erreur lors de la mise à jour du membre de secours", error.message);
    }
  });
  
  module.exports = router;
  


module.exports = router;
