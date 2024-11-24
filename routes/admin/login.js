const express = require('express');
const router = express.Router();
const { User } = require('../../models');
const { verifyRequestData, compareWithBcrypt } = require('../../config/utils');

router.post('/', async (req, res) => {
    const requiredFields = ["email", "password"];
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
        const { email, password } = req.body;

        // Chercher l'admin
        const admin = await User.findOne({
            where: {
                email,
                role: 'ADMIN'
            }
        });

        if (!admin) {
            return res.status(400).json({
                message: "Email inconnu",
                data: null
            });
        }

        // Comparer le mot de passe
        const isPasswordValid = await compareWithBcrypt(password, admin.password_hash);
        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Mot de passe incorrect",
                data: null
            });
        }

        res.status(200).json({
            message: "Connexion réussie",
            data: {
                id: admin.id,
                email: admin.email,
                firstName: admin.first_name,
                lastName: admin.last_name,
                role: admin.role
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Erreur serveur",
            data: error.message
        });
    }
});

module.exports = router;