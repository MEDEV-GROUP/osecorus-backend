var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');  // N'oubliez pas d'installer cors

// Import des controllers
const AdminController = require('./controllers/AdminController');
const CitizenController = require('./controllers/CitizenController');



var app = express();

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

// Routes des controllers
app.use('/admin', (req, res, next) => {
    console.log("__AdminController________________________________");
    next();
}, AdminController);

app.use('/citizen', (req, res, next) => {
    console.log("__CitizenController________________________________");
    next();
}, CitizenController);

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(`${new Date().toISOString()} - Error:`, err);
    res.status(err.status || 500).json({
        message: err.message,
        data: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

module.exports = app;