const express = require('express');
const router = express.Router();
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const { Notification } = require('../../models');
const { Op } = require('sequelize');

router.get('/', authenticate(), async (req, res) => {
   const logData = {
       message: "",
       source: "getUnreadNotificationsCount",
       userId: req.user?.id,
       action: "Get Unread Notifications Count",
       ipAddress: req.ip,
       status: "PENDING"
   };

   try {
       const count = await Notification.count({
           where: {
               [Op.or]: [
                   { recipient_id: req.user.id },
                   {
                       [Op.and]: [
                           { type: 'MASS' },
                           { target: req.user.role }
                       ]
                   }
               ],
               is_read: false
           }
       });

       logData.message = "Nombre de notifications non lues récupéré avec succès";
       logData.status = "SUCCESS";
       logData.responseData = { count };
       await Logger.logEvent(logData);

       return ApiResponse.success(res, logData.message, { count });
   } catch (error) {
       logData.message = "Erreur lors du comptage des notifications";
       logData.status = "FAILED";
       logData.responseData = { error: error.message };
       await Logger.logEvent(logData);

       return ApiResponse.serverError(res, logData.message, error.message);
   }
});

module.exports = router;