const express = require('express');
const router = express.Router();
const { RescueMember } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');

router.patch('/toggle-duty', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "toggleDutyStatus",
        userId: req.user?.id || null,
        action: "Toggle Duty Status",
        ipAddress: req.ip,
        requestData: req.body,
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };
    

    try {
        const { user } = req;

        // Vérifier que l'utilisateur est un membre de secours
        if (user.role !== 'RESCUE_MEMBER') {
            logData.message = "Accès interdit : seuls les membres de secours peuvent effectuer cette action";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.unauthorized(res, logData.message);
        }

        // Récupérer le RescueMember associé à l'utilisateur
        const rescueMember = await RescueMember.findOne({
            where: { user_id: user.id }
        });

        if (!rescueMember) {
            logData.message = "Membre de secours non trouvé";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message);
        }

        // Inverser le statut is_on_duty
        const newDutyStatus = !rescueMember.is_on_duty;
        await rescueMember.update({ is_on_duty: newDutyStatus });

        logData.message = `Statut de service modifié avec succès. Nouveau statut : ${newDutyStatus ? 'En service' : 'Hors service'}`;
        logData.status = "SUCCESS";
        logData.responseData = {
            id: rescueMember.id,
            isOnDuty: newDutyStatus
        };
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, logData.responseData);

    } catch (error) {
        logData.message = "Erreur lors de la modification du statut de service";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

module.exports = router;