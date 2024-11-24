const express = require('express');
const router = express.Router();

const service = 'admin';

// Routes spécifiques
const login = require('../routes/' + service + '/login');
const createRescueMember = require('../routes/' + service + '/createRescueMember');
const getRescueMembers = require('../routes/' + service + '/getRescueMembers');

// Utilisation des routes
router.use('/login', login);
router.use('/rescue-member', createRescueMember);
router.use('/get-rescue-member', getRescueMembers);


module.exports = router;