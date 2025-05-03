const express = require('express');
const router = express.Router();

const service = 'citizen';

// Routes spécifiques
const createAlert = require('../routes/' + service + '/createAlert');
const getLatestAlert = require('../routes/' + service + '/getLatestAlert');
const getAllCitizenAlerts = require('../routes/' + service + '/getAllCitizenAlerts');
const registerCitizen = require('../routes/' + service + '/registerCitizen');
const otpRequest = require('../routes/' + service + '/otpRequest');
const verifyOtp = require('../routes/' + service + '/verifyOtp');
const addPhoto = require('../routes/' + service + '/addPhoto');
const addEmail = require('../routes/' + service + '/addEmail');
const createSafeNumbers = require('../routes/' + service + '/createSafeNumbers');
const deleteSafeNumbers = require('../routes/' + service + '/deleteSafeNumbers');
const getSafeNumbers = require('../routes/' + service + '/getSafeNumbers');
const safeBroadcast = require('../routes/' + service + '/safeBroadcast');
const reverse = require('../routes/' + service + '/reverse');
const getAlertDetails = require('../routes/' + service + '/getAlertDetails');
const loginWithPhone = require('../routes/' + service + '/loginWithPhone'); // Nouvelle route





// Utilisation des routes
router.use('/create-alert', createAlert);
router.use('/latest-alert', getLatestAlert);
router.use('/all-alerts', getAllCitizenAlerts);
router.use('/get-alert-details', getAlertDetails);
router.use('/register', registerCitizen);
router.use('/otp-request', otpRequest);
router.use('/verify-otp', verifyOtp);
router.use('/add-picture', addPhoto);
router.use('/add-email', addEmail);
router.use('/safe-numbers', createSafeNumbers);
router.use('/safe-numbers', deleteSafeNumbers);
router.use('/safe-numbers', getSafeNumbers);
router.use('/safe', safeBroadcast);
router.use('/login', loginWithPhone); // Ajout de la route de connexion


router.use('/reverse-geocode', reverse);


module.exports = router;