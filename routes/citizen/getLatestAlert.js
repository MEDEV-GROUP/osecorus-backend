const express = require('express');
const router = express.Router();
const { Alert, AlertMedia } = require('../../models');

router.get('/:userId', async (req, res) => {
   try {
       const { userId } = req.params;

       const latestAlert = await Alert.findOne({
           where: { reporter_id: userId },
           include: [{
               model: AlertMedia,
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