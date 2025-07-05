const express = require('express');
const router = express.Router();

const service = 'etablissement-sante';

// Routes spécifiques
const getEtablissementsSante = require('../routes/' + service + '/getEtablissementsSante');
const getNearbyEtablissementsSante = require('../routes/' + service + '/getNearbyEtablissementsSante');
const filterEtablissementsSante = require('../routes/' + service + '/filterEtablissementsSante');

// Utilisation des routes
router.use('/list', getEtablissementsSante);
router.use('/nearby', getNearbyEtablissementsSante);
router.use('/filter', filterEtablissementsSante);

module.exports = router;