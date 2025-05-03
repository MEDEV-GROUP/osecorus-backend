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
const getInterventions = require('../routes/' + service + '/getInterventions'); // Nouvelle route ajoutée
const getInterventionDetails = require('../routes/' + service + '/getInterventionDetails'); // Nouvelle route ajoutée






// Utilisation des routes
router.use('/create', createIntervention);
router.use('/', updateInterventionStatus);  // Cela permettra d'accéder à /:id/status
router.use('/latest-intervention', latestIntervention);
router.use('/get-all-interventions', getAllInterventions);
router.use('/history', getInterventionsHistory);
router.use('/get-intervention', getInterventionById);
router.use('/list', getInterventions); // Ajout de la nouvelle route
router.use('/details', getInterventionDetails); // Ajout de la nouvelle route détaillée





module.exports = router;