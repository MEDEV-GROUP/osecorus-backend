const express = require('express');
const router = express.Router();

const service = 'rescue';

// Routes spécifiques
const login = require('../routes/' + service + '/login');
const toggleDutyStatus = require('../routes/' + service + '/toggleDutyStatus');
const latestIntervention = require('../routes/' + service + '/latestIntervention');


// Utilisation des routes
router.use('/login', login);
router.use('/duty-status', toggleDutyStatus);
router.use('/intervention', latestIntervention);

module.exports = router;