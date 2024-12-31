const express = require('express');
const router = express.Router();

const service = 'admin';

// Routes spécifiques
const login = require('../routes/' + service + '/login');
const createRescueServices = require('../routes/' + service + '/createRescueServices');
const deactivateRescueServices = require('../routes/' + service + '/deactivateRescueServices');
const activateRescueServices = require('../routes/' + service + '/activateRescueServices');
const updateRescueServices = require('../routes/' + service + '/updateRescueServices');
const allRescueServices = require('../routes/' + service + '/allRescueServices');
const createRescueMember = require('../routes/' + service + '/createRescueMember');
const updateRescueMember = require('../routes/' + service + '/updateRescueMember');
const softDeleteRescueMember = require('../routes/' + service + '/softDeleteRescueMember');
const rescueMember = require('../routes/' + service + '/rescueMember');
const allRescueMembers = require('../routes/' + service + '/allRescueMembers');
const availableRescueMembers = require('../routes/' + service + '/availableRescueMembers');
const publishMessage = require('../routes/' + service + '/publishMessage');
const getAlerts = require('../routes/' + service + '/getAlerts');
const getAllMessages = require('../routes/' + service + '/getAllMessages');
const dashboard = require('../routes/' + service + '/dashboard');
const basicStats = require('../routes/' + service + '/basicStats');
const alertsByCategory = require('../routes/' + service + '/alertsByCategory');
const alertsByCommune = require('../routes/' + service + '/alertsByCommune');
const activeUsers = require('../routes/' + service + '/activeUsers');



// Utilisation des routes
router.use('/login', login);
router.use('/create-rescue-service', createRescueServices);
router.use('/deactivate-rescue-service', deactivateRescueServices);
router.use('/activate-rescue-service', activateRescueServices);
router.use('/update-rescue-service', updateRescueServices);
router.use('/all-rescue-services', allRescueServices);
router.use('/create-rescue-member', createRescueMember);
router.use('/update-rescue-member', updateRescueMember);
router.use('/soft-delete-rescue-member', softDeleteRescueMember);
router.use('/rescue-member', rescueMember);
router.use('/all-rescue-members', allRescueMembers);
router.use('/available-rescue-members', availableRescueMembers);
router.use('/publish-message', publishMessage);
router.use('/get-all-message', getAllMessages);
router.use('/all-alerts', getAlerts);
router.use('/dashboard', dashboard);
router.use('/basic-stats', basicStats);
router.use('/alerts-by-category', alertsByCategory);
router.use('/alerts-by-commune', alertsByCommune);
router.use('/active-users', activeUsers);



module.exports = router;