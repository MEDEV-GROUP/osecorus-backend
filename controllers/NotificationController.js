const express = require('express');
const router = express.Router();

const service = 'notification';

// Routes spécifiques
const getUnreadNotifications = require('../routes/' + service + '/getUnreadNotifications');
const markNotificationAsRead = require('../routes/' + service + '/markNotificationAsRead');
const getUnreadNotificationsCount = require('../routes/' + service + '/getUnreadNotificationsCount');
const registerExternalId = require('../routes/' + service + '/registerExternalId');
const sendToAllCitizens = require('../routes/' + service + '/sendToAllCitizens');

// Utilisation des routes
router.use('/unread', getUnreadNotifications);
router.use('/:id/read', markNotificationAsRead);
router.use('/unread/count', getUnreadNotificationsCount);
router.use('/external-id', registerExternalId);
router.use('/send-to-citizens', sendToAllCitizens);


module.exports = router;