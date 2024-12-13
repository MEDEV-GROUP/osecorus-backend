const { Log } = require('../models'); // Assurez-vous que le modèle `Log` est bien configuré dans votre dossier `models`

class Logger {
    /**
     * Enregistre un log dans la base de données.
     * @param {Object} options - Détails du log.
     * @param {string} options.message - Message descriptif de l'événement.
     * @param {string} [options.source] - Source de l'événement (nom du module ou de la route).
     * @param {string} [options.userId] - Identifiant de l'utilisateur (facultatif).
     * @param {string} [options.action] - Action effectuée (ex. "Create Alert").
     * @param {string} [options.ipAddress] - Adresse IP de la requête.
     * @param {Object} [options.requestData] - Données envoyées dans la requête.
     * @param {Object} [options.responseData] - Données de la réponse.
     * @param {string} [options.status] - Statut de l'opération (ex. "SUCCESS", "FAILED").
     * @param {string} [options.environment] - Environnement (par ex. "Production").
     * @param {Object} [options.deviceInfo] - Informations sur l'appareil.
     */
    static async logEvent({
        message,
        source = null,
        userId = null,
        action = null,
        ipAddress = null,
        requestData = null,
        responseData = null,
        status = null,
        environment = process.env.NODE_ENV || 'development',
        deviceInfo = null,
    }) {
        try {
            await Log.create({
                message,
                source,
                user_id: userId,
                action,
                ip_address: ipAddress,
                request_data: requestData,
                response_data: responseData,
                status,
                environment,
                device_info: deviceInfo,
            });
        } catch (error) {
            console.error('Erreur lors de l’enregistrement du log:', error.message);
            // Vous pouvez envisager d'envoyer cet événement à un système de logs externe si nécessaire
        }
    }
}

module.exports = Logger;
