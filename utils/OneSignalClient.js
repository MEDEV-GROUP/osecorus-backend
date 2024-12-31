// utils/OneSignalClient.js
const axios = require('axios');

class OneSignalClient {
    constructor() {
        this.appId = process.env.ONESIGNAL_APP_ID;
        this.apiKey = process.env.ONESIGNAL_REST_API_KEY;
        this.client = axios.create({
            baseURL: 'https://onesignal.com/api/v1',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${this.apiKey}`
            }
        });
    }

    async sendNotification({ headings, contents, externalIds = [], data = null }) {
        try {
            // Log pour debug
            console.log('AppID:', this.appId);
            
            const notification = {
                app_id: String(this.appId), // Assurons-nous que c'est un string
                include_external_user_ids: externalIds,
                headings: { en: headings },
                contents: { en: contents },
                channel_for_external_user_ids: "push",
                data: data || {}
            };

            // Log pour debug
            console.log('Notification payload:', JSON.stringify(notification, null, 2));

            const response = await this.client.post('/notifications', notification);
            
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            // Log pour debug
            console.error('Config:', {
                appId: this.appId,
                hasApiKey: !!this.apiKey
            });

            console.error('Erreur OneSignal:', error.response ? {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            } : error.message);
            
            return {
                success: false,
                error: error.response ? error.response.data : error.message
            };
        }
    }

    async sendNotificationToAll({ headings, contents, data = null }) {
        try {
            const notification = {
                app_id: String(this.appId),
                included_segments: ['Subscribed Users'],
                headings: { en: headings },
                contents: { en: contents },
                data: data || {}
            };

            const response = await this.client.post('/notifications', notification);
            
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Erreur OneSignal:', error.response ? {
                status: error.response.status,
                data: error.response.data
            } : error.message);
            
            return {
                success: false,
                error: error.response ? error.response.data : error.message
            };
        }
    }
}

// Créer une instance unique
const oneSignalClient = new OneSignalClient();

// Test de la configuration au démarrage
console.log('OneSignal Configuration:', {
    appId: oneSignalClient.appId,
    hasApiKey: !!oneSignalClient.apiKey
});

// Exporter l'instance
module.exports = oneSignalClient;