const express = require('express');
const router = express.Router();

const service = 'intervention';

// Routes spécifiques
const createIntervention = require('../routes/' + service + '/createIntervention');
const updateInterventionStatus = require('../routes/' + service + '/updateInterventionStatus');
const latestIntervention = require('../routes/' + service + '/latestIntervention');
const getAllInterventions = require('../routes/' + service + '/getAllInterventions');
const getInterventionsHistory = require('../routes/' + service + '/getInterventionsHistory');
const getInterventionById = require('../routes/' + service + '/getInterventionById');




// Utilisation des routes
router.use('/create', createIntervention);
router.use('/', updateInterventionStatus);  // Cela permettra d'accéder à /:id/status
router.use('/latest-intervention', latestIntervention);
router.use('/get-all-interventions', getAllInterventions);
router.use('/history', getInterventionsHistory);
router.use('/get-intervention', getInterventionById);



module.exports = router;