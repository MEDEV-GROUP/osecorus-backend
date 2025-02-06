var express = require('express');
require('dotenv').config();
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');  // N'oubliez pas d'installer cors
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const oneSignalClient = require('./utils/OneSignalClient');

// Import des controllers
const AdminController = require('./controllers/AdminController');
const CitizenController = require('./controllers/CitizenController');
const RescueController = require('./controllers/RescueController');
const InterventionController = require('./controllers/InterventionController');
const NotificationController = require('./controllers/NotificationController');



var app = express();

// Configuration du rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1500, // Limite chaque IP à 100 requêtes par fenêtre (ici 15 minutes)
    standardHeaders: true, // Retourne les infos de rate limit dans les headers `RateLimit-*`
    legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
    message: {
        status: 429,
        message: 'Trop de requêtes, veuillez réessayer plus tard.'
    }
});

// Configuration de base de Helmet pour API
app.use(helmet());

// Configuration spécifique pour Permissions-Policy
app.use((req, res, next) => {
    res.setHeader(
        'Permissions-Policy',
        'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()'
    );
    next();
});

// Appliquer le rate limiter à toutes les requêtes
app.use(limiter);

// Configuration CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware pour les logs
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Configuration des dossiers statiques
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Pour accéder aux fichiers uploadés
app.use('/others', express.static(path.join(__dirname, 'others'))); // Pour accéder aux fichiers uploadés

// Routes des controllers
app.use('/admin', (req, res, next) => {
    console.log("__AdminController________________________________");
    next();
}, AdminController);

app.use('/citizen', (req, res, next) => {
    console.log("__CitizenController________________________________");
    next();
}, CitizenController);

app.use('/rescue', (req, res, next) => {
    console.log("__RescueController________________________________");
    next();
}, RescueController);

app.use('/intervention', (req, res, next) => {
    console.log("__InterventionController________________________________");
    next();
}, InterventionController);

app.use('/notifications', (req, res, next) => {
    console.log("__NotificationController________________________________");
    next();
}, NotificationController);

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(`${new Date().toISOString()} - Error:`, err);
    res.status(err.status || 500).json({
        message: err.message,
        data: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

module.exports = app;