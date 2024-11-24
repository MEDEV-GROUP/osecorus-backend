const express = require('express');
const router = express.Router();

const service = 'citizen';

// Routes spécifiques
const createAlert = require('../routes/' + service + '/createAlert');
const getLatestAlert = require('../routes/' + service + '/getLatestAlert');

// Utilisation des routes
router.use('/create-alert', createAlert);
router.use('/latest-alert', getLatestAlert);

module.exports = router;