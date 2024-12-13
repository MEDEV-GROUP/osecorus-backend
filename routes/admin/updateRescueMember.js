const express = require('express');
const router = express.Router();
const { User, RescueMember, RescueService } = require('../../models');
const { verifyRequestDataForUpdate } = require('../../config/utils');
const ApiResponse = require('../../utils/ApiResponse'); // Réponses standardisées
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs

// Route pour modifier un membre de secours
router.put('/:id', authenticate(), async (req, res) => {
  const logData = {
    message: "",
    source: "updateRescueMember",
    userId: req.user?.id || null,
    action: "Update Rescue Member",
    ipAddress: req.ip,
    requestData: req.body || null,
    responseData: null,
    status: "PENDING",
    deviceInfo: req.headers['user-agent'] || 'Unknown Device'
  };

  const { user } = req;

  // Vérification du rôle d'administrateur
  if (user.role !== 'ADMIN') {
    logData.message = "Accès interdit : seuls les administrateurs peuvent effectuer cette action";
    logData.status = "FAILED";
    await Logger.logEvent(logData);

    return ApiResponse.unauthorized(res, logData.message);
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
    logData.message = "Certains champs ne sont pas autorisés pour la mise à jour";
    logData.status = "FAILED";
    logData.responseData = { invalidFields: verify.invalidFields };
    await Logger.logEvent(logData);

    return ApiResponse.badRequest(res, logData.message, logData.responseData);
  }

  try {
    const rescueMember = await RescueMember.findByPk(id, {
      include: {
        model: User,
        as: 'user' // Alias exact défini dans le modèle
      }
    });

    if (!rescueMember) {
      logData.message = "Membre de secours introuvable";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    if (!rescueMember.user) {
      logData.message = "Aucun utilisateur associé à ce membre de secours";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
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

    logData.message = "Membre de secours mis à jour avec succès";
    logData.status = "SUCCESS";
    logData.responseData = {
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
    };
    await Logger.logEvent(logData);

    return ApiResponse.success(res, logData.message, logData.responseData);
  } catch (error) {
    logData.message = "Erreur lors de la mise à jour du membre de secours";
    logData.status = "FAILED";
    logData.responseData = { error: error.message };
    await Logger.logEvent(logData);

    return ApiResponse.serverError(res, logData.message, error.message);
  }
});

module.exports = router;
