const express = require('express');
const router = express.Router();

const service = 'rescue';

// Routes spécifiques
const login = require('../routes/' + service + '/login');
const toggleDutyStatus = require('../routes/' + service + '/toggleDutyStatus');
const getDailyStats = require('../routes/' + service + '/getDailyStats');


// Utilisation des routes
router.use('/login', login);
router.use('/duty-status', toggleDutyStatus);
router.use('/daily-stats', getDailyStats);

module.exports = router;