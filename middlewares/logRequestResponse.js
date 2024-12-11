const { Log } = require('../models'); // Importer le modèle Log

/**
 * Middleware pour enregistrer les logs des requêtes et réponses.
 */
const logRequestResponse = async (req, res, next) => {
    const originalSend = res.send; // Stocker la méthode `send` d'origine
    const startTime = Date.now(); // Enregistrer l'heure de début de la requête

    res.send = async function (body) {
        // Capturer la réponse
        const responseBody = typeof body === 'string' ? body : JSON.parse(body);

        // Extraire les informations nécessaires pour le log
        const logData = {
            ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress, // Adresse IP de l'utilisateur
            user_type: req.user ? req.user.role : 'ANONYMOUS', // Rôle de l'utilisateur, ou 'ANONYMOUS' si non authentifié
            email: req.user && req.user.email ? req.user.email : null, // Email de l'utilisateur, si disponible
            action: req.method, // Méthode HTTP (GET, POST, etc.)
            route: req.originalUrl, // Route API appelée
            request: req.body, // Données de la requête envoyée par l'utilisateur
            response: responseBody, // Réponse retournée à l'utilisateur
        };

        try {
            // Enregistrer le log dans la base de données
            await Log.create(logData);
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement du log:', error.message);
        }

        // Retourner la réponse originale
        return originalSend.call(this, body);
    };

    next(); // Continuer au middleware suivant
};

module.exports = { logRequestResponse };
