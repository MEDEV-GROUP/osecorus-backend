const { Op, literal } = require('sequelize');
const { Notification, User, ExternalId, sequelize } = require('../models');
const Logger = require('./Logger');
const oneSignalClient = require('./OneSignalClient');

class NotificationManager {
    /**
     * Crée une notification unique pour un utilisateur spécifique
     */
    static async createUniqueNotification(senderId, recipientId, message, title = "") {
        const logData = {
            source: "NotificationManager",
            action: "Create Unique Notification",
            status: "PENDING"
        };

        try {
            const notification = await Notification.create({
                sender_id: senderId,
                recipient_id: recipientId,
                message,
                type: 'UNIQUE'
            });

            // Récupérer l'external ID de l'utilisateur
            const externalId = await ExternalId.findOne({
                where: { user_id: recipientId }
            });

            // Si l'utilisateur a un external ID, envoyer la notification via OneSignal
            if (externalId) {
                await oneSignalClient.sendNotification({
                    headings: title || "Nouvelle notification",
                    contents: message,
                    externalIds: [externalId.external_id],
                    data: {
                        notificationId: notification.id,
                        type: 'UNIQUE'
                    }
                });
            }

            logData.status = "SUCCESS";
            logData.message = "Notification unique créée avec succès";
            await Logger.logEvent(logData);

            return notification;
        } catch (error) {
            logData.status = "FAILED";
            logData.message = "Erreur lors de la création de la notification unique";
            logData.responseData = { error: error.message };
            await Logger.logEvent(logData);
            throw error;
        }
    }

    /**
     * Crée une notification de masse pour un type d'utilisateurs (RESCUE ou CITIZEN)
     */
    static async createMassNotification(senderId, target, message, title = "") {
        const logData = {
            source: "NotificationManager",
            action: "Create Mass Notification",
            status: "PENDING"
        };

        try {
            const notification = await Notification.create({
                sender_id: senderId,
                message,
                type: 'MASS',
                target
            });

            // Récupérer tous les external IDs des utilisateurs du type cible
            const externalIds = await ExternalId.findAll({
                include: [{
                    model: User,
                    as: 'user',
                    where: { role: target }
                }],
                attributes: ['external_id']
            });

            // Si des utilisateurs ont des external IDs, envoyer la notification via OneSignal
            if (externalIds.length > 0) {
                const externalIdList = externalIds.map(e => e.external_id);
                await oneSignalClient.sendNotification({
                    headings: title || "Nouvelle notification",
                    contents: message,
                    externalIds: externalIdList,
                    data: {
                        notificationId: notification.id,
                        type: 'MASS',
                        target
                    }
                });
            }

            logData.status = "SUCCESS";
            logData.message = "Notification de masse créée avec succès";
            await Logger.logEvent(logData);

            return notification;
        } catch (error) {
            logData.status = "FAILED";
            logData.message = "Erreur lors de la création de la notification de masse";
            logData.responseData = { error: error.message };
            await Logger.logEvent(logData);
            throw error;
        }
    }

    /**
     * Marque une notification comme lue
     */
    static async markAsRead(notificationId) {
        const logData = {
            source: "NotificationManager",
            action: "Mark Notification as Read",
            status: "PENDING"
        };

        try {
            const notification = await Notification.findByPk(notificationId);
            if (!notification) {
                throw new Error('Notification introuvable');
            }

            await notification.update({ is_read: true });

            logData.status = "SUCCESS";
            logData.message = "Notification marquée comme lue";
            await Logger.logEvent(logData);

            return notification;
        } catch (error) {
            logData.status = "FAILED";
            logData.message = "Erreur lors du marquage de la notification";
            logData.responseData = { error: error.message };
            await Logger.logEvent(logData);
            throw error;
        }
    }

    /**
     * Récupère les notifications d'un utilisateur
     */
    static async getUserNotifications(userId, options = {}) {
        const logData = {
            source: "NotificationManager",
            action: "Get User Notifications",
            status: "PENDING"
        };

        try {
            const where = {
                [Op.or]: [
                    { recipient_id: userId },
                    {
                        [Op.and]: [
                            { type: 'MASS' },
                            {
                                target: {
                                    [Op.eq]: literal(
                                        `(SELECT role FROM Users WHERE id = '${userId}')`
                                    )
                                }
                            }
                        ]
                    }
                ]
            };

            if (options.unreadOnly) {
                where.is_read = false;
            }

            const notifications = await Notification.findAll({
                where,
                include: [{
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'first_name', 'last_name', 'role']
                }],
                order: [['created_at', 'DESC']],
                ...options
            });

            logData.status = "SUCCESS";
            logData.message = "Notifications récupérées avec succès";
            await Logger.logEvent(logData);

            return notifications;
        } catch (error) {
            logData.status = "FAILED";
            logData.message = "Erreur lors de la récupération des notifications";
            logData.responseData = { error: error.message };
            await Logger.logEvent(logData);
            throw error;
        }
    }
}

module.exports = NotificationManager;