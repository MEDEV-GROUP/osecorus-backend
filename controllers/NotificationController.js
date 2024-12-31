const express = require('express');
const router = express.Router();

const service = 'notification';

// Routes spécifiques
const getUnreadNotifications = require('../routes/' + service + '/getUnreadNotifications');
const markNotificationAsRead = require('../routes/' + service + '/markNotificationAsRead');
const getUnreadNotificationsCount = require('../routes/' + service + '/getUnreadNotificationsCount');
const registerExternalId = require('../routes/' + service + '/registerExternalId');

// Utilisation des routes
router.use('/unread', getUnreadNotifications);
router.use('/:id/read', markNotificationAsRead);
router.use('/unread/count', getUnreadNotificationsCount);
router.use('/external-id', registerExternalId);


module.exports = router;