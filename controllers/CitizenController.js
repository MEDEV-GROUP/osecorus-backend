const express = require('express');
const router = express.Router();

const service = 'citizen';

// Routes spécifiques
const createAlert = require('../routes/' + service + '/createAlert');
const getLatestAlert = require('../routes/' + service + '/getLatestAlert');
const registerCitizen = require('../routes/' + service + '/registerCitizen');
const otpRequest = require('../routes/' + service + '/otpRequest');
const verifyOtp = require('../routes/' + service + '/verifyOtp');



// Utilisation des routes
router.use('/create-alert', createAlert);
router.use('/latest-alert', getLatestAlert);
router.use('/register', registerCitizen);
router.use('/otp-request', otpRequest);
router.use('/verify-otp', verifyOtp);


module.exports = router;