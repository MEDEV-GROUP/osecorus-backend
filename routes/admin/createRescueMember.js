const express = require('express');
const router = express.Router();
const { User, RescueMember, RescueService, UserPhoto } = require('../../models');
const { verifyMultipartData, cryptWithBcrypt } = require('../../config/utils'); // Utilitaires pour valider et hacher
const ApiResponse = require('../../utils/ApiResponse'); // Réponses standardisées
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification
const upload = require('../../config/multer'); // Middleware Multer pour les téléchargements

// Utiliser multer pour gérer le téléchargement du champ 'img'
const uploadSingle = upload.single('img');

router.post('/', authenticate(), uploadSingle, async (req, res) => {
  // Vérification du rôle d'administrateur
  const { user } = req;
  if (user.role !== 'ADMIN') {
    return ApiResponse.unauthorized(res, "Accès interdit : seuls les administrateurs peuvent effectuer cette action");
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
    return ApiResponse.badRequest(res, "Champs requis manquants", {
      missingFields: verify.missingFields
    });
  }

// Vérifier si le fichier associé à la clé 'img' est bien présent
if (!req.file || req.file.fieldname !== 'img') {
  return ApiResponse.badRequest(res, "La photo de profil est obligatoire !");
}

console.log(!req.file || req.file.fieldname !== 'img')


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
      return ApiResponse.badRequest(res, "Cet email est déjà utilisé");
    }

    // Vérifier si le badge existe déjà
    const existingBadge = await RescueMember.findOne({ where: { badge_number: badgeNumber } });
    if (existingBadge) {
      return ApiResponse.badRequest(res, "Ce numéro de badge est déjà utilisé");
    }

    // Vérifier si le service de secours existe
    const rescueService = await RescueService.findByPk(rescueServiceId);
    if (!rescueService) {
      return ApiResponse.badRequest(res, "Service de secours introuvable");
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

    return ApiResponse.created(res, "Membre de secours créé avec succès", {
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
      photo: photoUrl // Inclure l'URL de l'image dans la réponse
    });
  } catch (error) {
    return ApiResponse.serverError(res, "Erreur lors de la création du membre de secours", error.message);
  }
});

module.exports = router;
