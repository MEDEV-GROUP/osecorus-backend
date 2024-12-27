
const { Op, literal } = require('sequelize');
const { Notification, User, sequelize } = require('../models');
const Logger = require('./Logger');

class NotificationManager {
    /**
     * Crée une notification unique pour un utilisateur spécifique
     */
    static async createUniqueNotification(senderId, recipientId, message) {
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
    static async createMassNotification(senderId, target, message) {
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