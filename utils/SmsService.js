const axios = require('axios');
const Logger = require('./Logger');

/**
 * Service d'envoi de SMS via Letexto
 */
class SmsService {

    /**
     * Effectue une requête GET HTTP
     * @param {Object} options - Options de la requête
     * @param {string} options.baseUrl - URL de base
     * @param {string} options.endpoint - Endpoint avec paramètres
     * @returns {Promise<Object>} Résultat de la requête
     */
    static async makeGetRequest({ baseUrl, endpoint }) {
        try {
            const response = await axios.get(`${baseUrl}${endpoint}`, {
                timeout: 10000 // 10 secondes
            });

            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || error.message,
                status: error.response?.status || 500
            };
        }
    }

    /**
     * Envoie un SMS via l'API Letexto
     * @param {string} phone - Numéro de téléphone (sans indicatif pays)
     * @param {string} message - Message à envoyer
     * @returns {Promise<Object>} Résultat de l'envoi
     */
    static async sendSms(phone, message) {
        let result = {
            success: false,
            message: '',
            data: null,
        };

        try {
            const baseUrl = process.env.LETEXTO_BASE_URL;
            const apiKey = process.env.LETEXTO_API_KEY;
            const sender = process.env.LETEXTO_SENDER || 'OSECOURS';
            const countryCode = process.env.LETEXTO_COUNTRY_CODE || '+225';

            // Validation des paramètres
            if (!baseUrl || !apiKey) {
                result.message = 'Configuration SMS manquante';
                return result;
            }

            if (!phone || !message) {
                result.message = 'Numéro de téléphone et message requis';
                return result;
            }

            // Construction de l'endpoint
            let endpoint = '/messages/send';
            endpoint += `?token=${apiKey}`;
            endpoint += `&from=${sender}`;
            endpoint += `&to=${countryCode}${phone}`;
            endpoint += `&content=${encodeURIComponent(message)}`;

            // Envoi de la requête
            const rLetextoSms = await this.makeGetRequest({
                baseUrl,
                endpoint: endpoint,
            });

            if (rLetextoSms.success) {
                result.success = true;
                result.data = rLetextoSms.data;

                // Log de succès
                await Logger.logEvent({
                    message: `SMS envoyé avec succès au ${countryCode}${phone}`,
                    source: 'SmsService',
                    action: 'SMS_SENT',
                    requestData: { phone: `${countryCode}${phone}` },
                    status: 'SUCCESS'
                });
            } else {
                result.message = `Erreur lors de l'envoi du SMS via Letexto: ${rLetextoSms.message}`;

                // Log d'erreur
                await Logger.logEvent({
                    message: result.message,
                    source: 'SmsService',
                    action: 'SMS_FAILED',
                    requestData: { phone: `${countryCode}${phone}` },
                    status: 'FAILED'
                });
            }
        } catch (err) {
            console.error('Erreur Letexto:', err.message);
            result.message = `Erreur lors de l'envoi du SMS via Letexto: ${err.message}`;

            // Log d'erreur
            await Logger.logEvent({
                message: result.message,
                source: 'SmsService',
                action: 'SMS_ERROR',
                status: 'ERROR'
            });
        }

        return result;
    }

    /**
     * Génère un code OTP de 5 chiffres (comme l'ancien système Twilio)
     * @returns {string} Code OTP généré
     */
    static generateOtp() {
        return Math.floor(10000 + Math.random() * 90000).toString(); // OTP à 5 chiffres
    }

    /**
     * Envoie un OTP par SMS
     * @param {string} phone - Numéro de téléphone
     * @param {string} otp - Code OTP
     * @returns {Promise<Object>} Résultat de l'envoi
     */
    static async sendOtp(phone, otp) {
        const expirationMinutes = process.env.OTP_EXPIRATION_MINUTES || 5;
        const message = `Votre code de vérification O'secours est: ${otp}. Valable ${expirationMinutes} minutes.`;
        return await this.sendSms(phone, message);
    }
}

module.exports = SmsService;