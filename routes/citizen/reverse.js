const express = require('express');
const axios = require('axios');
const router = express.Router();
const ApiResponse = require('../../utils/ApiResponse'); // Classe pour formater les réponses

router.post('/reverse-geocode', async (req, res) => {
    const { lat, lon } = req.body;

    // Validation des entrées
    if (!lat || !lon || typeof lat !== 'number' || typeof lon !== 'number') {
        return ApiResponse.badRequest(res, "Latitude et longitude sont requises et doivent être des nombres.");
    }

    try {
        // Appel à l'API Nominatim
        const response = await axios.get('https://nominatim.openstreetmap.org/reverse.php', {
            params: {
                lat,
                lon,
                zoom: 18,
                format: 'jsonv2'
            }
        });

        const data = response.data;

        // Filtrer les informations importantes
        const importantData = {
            place_id: data.place_id,
            name: data.name,
            display_name: data.display_name,
            address: data.address || {},
            boundingbox: data.boundingbox || []
        };

        // Retourner une réponse formatée
        return ApiResponse.success(res, "Données récupérées avec succès.", importantData);
    } catch (error) {
        console.error("Erreur lors de la récupération des données de Nominatim:", error.message);
        return ApiResponse.serverError(res, "Erreur lors de la récupération des données.");
    }
});

module.exports = router;
