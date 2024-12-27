const express = require('express');
const router = express.Router();
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');
const NotificationManager = require('../../utils/NotificationManager');

router.get('/', authenticate(), async (req, res) => {
   const logData = {
       message: "",
       source: "getUnreadNotifications", 
       userId: req.user?.id,
       action: "Get Unread Notifications",
       ipAddress: req.ip,
       status: "PENDING"
   };

   try {
       const { user } = req;
       const notifications = await NotificationManager.getUserNotifications(user.id, {
           unreadOnly: true
       });

       logData.message = "Notifications non lues récupérées avec succès";
       logData.status = "SUCCESS";
       logData.responseData = notifications;
       await Logger.logEvent(logData);

       return ApiResponse.success(res, logData.message, notifications);
   } catch (error) {
       logData.message = "Erreur lors de la récupération des notifications";
       logData.status = "FAILED";
       logData.responseData = { error: error.message };
       await Logger.logEvent(logData);

       return ApiResponse.serverError(res, logData.message, error.message);
   }
});

module.exports = router;