const express = require('express');
const router = express.Router();
const { User, RescueMember, RescueService, UserPhoto } = require('../../models');
const { verifyMultipartData, cryptWithBcrypt } = require('../../config/utils'); // Utilitaires pour valider et hacher
const ApiResponse = require('../../utils/ApiResponse'); // Réponses standardisées
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification
const Logger = require('../../utils/Logger'); // Utilitaire pour les logs
const upload = require('../../config/multer'); // Middleware Multer pour les téléchargements

// Utiliser multer pour gérer le téléchargement du champ 'img'
const uploadSingle = upload.single('img');

router.post('/', authenticate(), uploadSingle, async (req, res) => {
  const logData = {
    message: "",
    source: "createRescueMember",
    userId: req.user?.id || null,
    action: "Create Rescue Member",
    ipAddress: req.ip,
    requestData: req.body || null,
    responseData: null,
    status: "PENDING",
    deviceInfo: req.headers['user-agent'] || 'Unknown Device'
  };

  // Vérification du rôle d'administrateur
  const { user } = req;
  if (user.role !== 'ADMIN') {
    logData.message = "Accès interdit : seuls les administrateurs peuvent effectuer cette action";
    logData.status = "FAILED";
    await Logger.logEvent(logData);

    return ApiResponse.unauthorized(res, logData.message);
  }

  const requiredFields = [
    "email", 
    "password", 
    "firstName", 
    "lastName", 
    "phoneNumber",
    "position",
    "badgeNumber",
    "rescueServiceId"
  ];
  
  const verify = verifyMultipartData(req, requiredFields);

  if (!verify.isValid) {
    logData.message = "Champs requis manquants";
    logData.status = "FAILED";
    logData.responseData = { missingFields: verify.missingFields };
    await Logger.logEvent(logData);

    return ApiResponse.badRequest(res, logData.message, logData.responseData);
  }

  // Vérifier si le fichier associé à la clé 'img' est bien présent
  if (!req.file || req.file.fieldname !== 'img') {
    logData.message = "La photo de profil est obligatoire";
    logData.status = "FAILED";
    await Logger.logEvent(logData);

    return ApiResponse.badRequest(res, logData.message);
  }

  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phoneNumber,
      position,
      badgeNumber,
      rescueServiceId
    } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      logData.message = "Cet email est déjà utilisé";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    // Vérifier si le badge existe déjà
    const existingBadge = await RescueMember.findOne({ where: { badge_number: badgeNumber } });
    if (existingBadge) {
      logData.message = "Ce numéro de badge est déjà utilisé";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    // Vérifier si le service de secours existe et est actif
    const rescueService = await RescueService.findByPk(rescueServiceId);
    if (!rescueService) {
      logData.message = "Service de secours introuvable";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    if (!rescueService.is_active) {
      logData.message = "Le service de secours est désactivé";
      logData.status = "FAILED";
      await Logger.logEvent(logData);

      return ApiResponse.badRequest(res, logData.message);
    }

    // Hacher le mot de passe
    const hashedPassword = await cryptWithBcrypt(password);

    // Créer l'utilisateur
    const newUser = await User.create({
      email,
      password_hash: hashedPassword,
      phone_number: phoneNumber,
      first_name: firstName,
      last_name: lastName,
      role: 'RESCUE_MEMBER',
      is_active: true
    });

    // Créer le membre de secours
    const rescueMember = await RescueMember.create({
      user_id: newUser.id,
      rescue_service_id: rescueServiceId,
      position,
      badge_number: badgeNumber,
      is_on_duty: false
    });

    // Enregistrer la photo de profil
    const photoUrl = `uploads/pictures/${req.file.filename}`;
    await UserPhoto.create({
      user_id: newUser.id,
      photo_url: photoUrl
    });

    logData.message = "Membre de secours créé avec succès";
    logData.status = "SUCCESS";
    logData.responseData = {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      phoneNumber: newUser.phone_number,
      role: newUser.role,
      position: rescueMember.position,
      badgeNumber: rescueMember.badge_number,
      rescueService: {
        id: rescueService.id,
        name: rescueService.name
      },
      photo: photoUrl
    };
    await Logger.logEvent(logData);

    return ApiResponse.created(res, logData.message, logData.responseData);
  } catch (error) {
    logData.message = "Erreur lors de la création du membre de secours";
    logData.status = "FAILED";
    logData.responseData = { error: error.message };
    await Logger.logEvent(logData);

    return ApiResponse.serverError(res, logData.message, error.message);
  }
});

module.exports = router;
