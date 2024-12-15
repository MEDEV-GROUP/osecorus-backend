const express = require('express');
const router = express.Router();
const { UserPhoto } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse'); // Classe pour les réponses API
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification
const upload = require('../../config/multer'); // Middleware Multer pour les téléchargements
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs

// Utiliser multer pour gérer le téléchargement du champ 'image'
const uploadSingle = upload.single('image');

router.post('/', authenticate(), uploadSingle, async (req, res) => {
  const logData = {
    message: "",
    source: "addCitizenPhoto",
    userId: req.user?.id || null,
    action: "Add Citizen Photo",
    ipAddress: req.ip,
    requestData: null,
    responseData: null,
    status: "PENDING",
    deviceInfo: req.headers['user-agent'] || 'Unknown Device'
  };

  const { user } = req;

  // Vérification que l'utilisateur est un citoyen
  if (user.role !== 'CITIZEN') {
    logData.message = "Accès interdit : seuls les citoyens peuvent effectuer cette action";
    logData.status = "FAILED";
    await Logger.logEvent(logData);

    return ApiResponse.unauthorized(res, logData.message);
  }

  // Vérification si un fichier est bien téléchargé
  if (!req.file || req.file.fieldname !== 'image') {
    logData.message = "L'image est obligatoire";
    logData.status = "FAILED";
    await Logger.logEvent(logData);

    return ApiResponse.badRequest(res, logData.message);
  }

  try {
    // Enregistrer l'image dans la base de données
    const photoUrl = `uploads/photos/${req.file.filename}`;
    const userPhoto = await UserPhoto.create({
      user_id: user.id,
      photo_url: photoUrl
    });

    logData.message = "Image enregistrée avec succès pour le citoyen";
    logData.status = "SUCCESS";
    logData.responseData = {
      userId: user.id,
      photoUrl: photoUrl
    };
    await Logger.logEvent(logData);

    return ApiResponse.success(res, logData.message, logData.responseData);
  } catch (error) {
    logData.message = "Erreur lors de l'enregistrement de l'image";
    logData.status = "FAILED";
    logData.responseData = { error: error.message };
    await Logger.logEvent(logData);

    return ApiResponse.serverError(res, logData.message, error.message);
  }
});

module.exports = router;
