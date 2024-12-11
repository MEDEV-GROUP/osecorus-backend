const express = require('express');
const router = express.Router();
const ApiResponse = require('../../utils/ApiResponse'); // Réponses standardisées
const { authenticate } = require('../../middlewares/authenticate'); // Middleware d'authentification
const { Alert, AlertMedia } = require('../../models');

router.get('/', authenticate(), async (req, res) => {
    const { user } = req;
    if (user.role !== 'CITIZEN') {
        return ApiResponse.unauthorized(res, "Accès interdit : seuls les Citoyens peuvent effectuer cette action");
    }
   try {
       const userId = user.id;

       const latestAlert = await Alert.findOne({
           where: { reporter_id: userId },
           include: [{
               model: AlertMedia,
               as: 'media',
               attributes: ['id', 'media_type', 'media_url']
           }],
           order: [['created_at', 'DESC']]
       });

       if (!latestAlert) {
           return res.status(200).json({
               message: "Aucune alerte trouvée pour cet utilisateur",
               data: null
           });
       }

       res.status(200).json({
           message: "Dernière alerte récupérée avec succès",
           data: latestAlert
       });

   } catch (error) {
       res.status(500).json({
           message: "Erreur lors de la récupération de la dernière alerte",
           data: error.message
       });
   }
});

module.exports = router;