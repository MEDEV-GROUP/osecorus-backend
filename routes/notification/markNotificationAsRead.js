const express = require('express');
const router = express.Router();
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const NotificationManager = require('../../utils/NotificationManager');

router.patch('/', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "markNotificationAsRead",
        userId: req.user?.id,
        action: "Mark Notification as Read",
        ipAddress: req.ip,
        requestData: { notificationId: req.params.id },
        status: "PENDING"
    };

    try {
        const notification = await NotificationManager.markAsRead(req.params.id);

        logData.message = "Notification marquée comme lue avec succès";
        logData.status = "SUCCESS";
        logData.responseData = notification;
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, notification);
    } catch (error) {
        logData.message = "Erreur lors du marquage de la notification";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;