const express = require('express');
const router = express.Router();
const { User, RescueMember } = require('../../models');
const { verifyRequestData, hashWithBcrypt } = require('../../config/utils');

router.post('/', async (req, res) => {
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
  
  const verify = verifyRequestData(req.body, requiredFields);

  if (!verify.isValid) {
    return res.status(400).json({ 
      message: "Champs requis manquants",
      data: {
        missingFields: verify.missingFields
      }
    });
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
      return res.status(400).json({ 
        message: "Cet email est déjà utilisé",
        data: null
      });
    }

    // Vérifier si le badge existe déjà
    const existingBadge = await RescueMember.findOne({ where: { badge_number: badgeNumber } });
    if (existingBadge) {
      return res.status(400).json({ 
        message: "Ce numéro de badge est déjà utilisé",
        data: null
      });
    }

    // Hash du mot de passe
    const hashedPassword = await hashWithBcrypt(password);

    // Création de l'utilisateur
    const user = await User.create({
      email,
      password_hash: hashedPassword,
      phone_number: phoneNumber,
      first_name: firstName,
      last_name: lastName,
      role: 'RESCUE_MEMBER',
      is_active: true
    });

    // Création du membre de secours
    const rescueMember = await RescueMember.create({
      user_id: user.id,
      rescue_service_id: rescueServiceId,
      position,
      badge_number: badgeNumber,
      is_on_duty: false
    });

    res.status(201).json({ 
      message: "Membre de secours créé avec succès",
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        position: rescueMember.position,
        badgeNumber: rescueMember.badge_number,
        rescueServiceId: rescueMember.rescue_service_id
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Erreur lors de la création du membre de secours",
      data: error.message
    });
  }
});

module.exports = router;