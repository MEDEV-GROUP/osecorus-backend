const express = require('express');
const router = express.Router();
const { Intervention, Alert, RescueMember, User } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');

router.get('/', authenticate(), async (req, res) => {
   const logData = {
       message: "",
       source: "getAllInterventions",
       userId: req.user?.id,
       action: "Get All Interventions",
       ipAddress: req.ip,
       status: "PENDING"
   };

   try {
       const { user } = req;

       if (user.role !== 'ADMIN') {
           logData.message = "Accès interdit : seuls les administrateurs peuvent effectuer cette action";
           logData.status = "FAILED";
           await Logger.logEvent(logData);
           return ApiResponse.unauthorized(res, logData.message);
       }

       const interventions = await Intervention.findAll({
           include: [
               {
                   model: Alert,
                   as: 'alert',
                   attributes: ['id', 'location_lat', 'location_lng', 'category', 'description', 'status', 'address']
               },
               {
                   model: RescueMember,
                   as: 'rescueMember',
                   attributes: ['id', 'position', 'badge_number', 'is_on_duty'],
                   include: [{
                       model: User,
                       as: 'user',
                       attributes: ['id', 'first_name', 'last_name', 'phone_number']
                   }]
               }
           ],
           order: [['start_time', 'DESC']]
       });

       logData.message = "Interventions récupérées avec succès";
       logData.status = "SUCCESS";
       logData.responseData = interventions;
       await Logger.logEvent(logData);

       return ApiResponse.success(res, logData.message, interventions);
   } catch (error) {
       logData.message = "Erreur lors de la récupération des interventions";
       logData.status = "FAILED";
       logData.responseData = { error: error.message };
       await Logger.logEvent(logData);

       return ApiResponse.serverError(res, logData.message, error.message);
   }
});

module.exports = router;