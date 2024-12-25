const express = require('express');
const router = express.Router();
const { Intervention, Alert, RescueMember } = require('../../models');
const { verifyRequestData } = require('../../config/utils');
const ApiResponse = require('../../utils/ApiResponse');
const { authenticate } = require('../../middlewares/authenticate');
const Logger = require('../../utils/Logger');
const NotificationManager = require('../../utils/NotificationManager');


router.patch('/:id/status', authenticate(), async (req, res) => {
    const logData = {
        message: "",
        source: "updateInterventionStatus",
        userId: req.user?.id || null,
        action: "Update Intervention Status",
        ipAddress: req.ip,
        requestData: { ...req.body, interventionId: req.params.id },
        responseData: null,
        status: "PENDING",
        deviceInfo: req.headers['user-agent'] || 'Unknown Device'
    };

    try {
        const { user } = req;
        const { id } = req.params;

        // Vérification des champs requis
        const requiredFields = ["status"];
        const verify = verifyRequestData(req.body, requiredFields);

        if (!verify.isValid) {
            logData.message = "Champs requis manquants";
            logData.status = "FAILED";
            logData.responseData = { missingFields: verify.missingFields };
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message, logData.responseData);
        }

        const { status, notes } = req.body;

        // Vérifier si le statut est valide
        const validStatuses = ['EN_ROUTE', 'SUR_PLACE', 'TERMINEE', 'ANNULEE'];
        if (!validStatuses.includes(status)) {
            logData.message = "Statut invalide";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message);
        }

        // Récupérer l'intervention
        const intervention = await Intervention.findByPk(id, {
            include: [
                {
                    model: Alert,
                    as: 'alert'
                },
                {
                    model: RescueMember,
                    as: 'rescueMember'
                }
            ]
        });

        if (!intervention) {
            logData.message = "Intervention introuvable";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message);
        }

        // Vérifier les permissions
        if (user.role === 'RESCUE_MEMBER') {
            // Un membre de secours ne peut modifier que ses propres interventions
            const rescueMember = await RescueMember.findOne({ where: { user_id: user.id } });
            if (!rescueMember || rescueMember.id !== intervention.rescue_member_id) {
                logData.message = "Vous n'êtes pas autorisé à modifier cette intervention";
                logData.status = "FAILED";
                await Logger.logEvent(logData);
                return ApiResponse.unauthorized(res, logData.message);
            }
        } else if (user.role !== 'ADMIN') {
            logData.message = "Accès non autorisé";
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.unauthorized(res, logData.message);
        }

        // Vérifier la validité de la transition de statut
        const currentStatus = intervention.status;
        const isValidTransition = validateStatusTransition(currentStatus, status);

        if (!isValidTransition) {
            logData.message = `Transition de statut invalide: ${currentStatus} → ${status}`;
            logData.status = "FAILED";
            await Logger.logEvent(logData);
            return ApiResponse.badRequest(res, logData.message);
        }

        // Mettre à jour les champs selon le nouveau statut
        const updateData = {
            status,
            notes: notes || intervention.notes
        };

        // Ajouter les timestamps appropriés
        if (status === 'SUR_PLACE') {
            updateData.arrival_time = new Date();
        } else if (status === 'TERMINEE') {
            updateData.end_time = new Date();
        }

        // Mise à jour de l'intervention
        await intervention.update(updateData);

        // Notifications selon le status
        if (status === 'SUR_PLACE') {
            await NotificationManager.createUniqueNotification(
                user.id,
                intervention.alert.reporter_id,
                `L'équipe de secours est arrivée sur place pour votre alerte.`
            );
        } else if (status === 'TERMINEE') {
            await intervention.alert.update({ status: 'RESOLUE' });
            await NotificationManager.createUniqueNotification(
                user.id,
                intervention.alert.reporter_id,
                `L'intervention concernant votre alerte est terminée.`
            );
        } else if (status === 'ANNULEE') {
            await NotificationManager.createUniqueNotification(
                user.id,
                intervention.alert.reporter_id,
                `L'intervention concernant votre alerte a été annulée.`
            );
        }

        // Mise à jour du statut de l'alerte si l'intervention est terminée
        if (status === 'TERMINEE') {
            await intervention.alert.update({ status: 'RESOLUE' });
        }

        // Récupérer l'intervention mise à jour avec ses relations
        const updatedIntervention = await Intervention.findByPk(id, {
            include: [
                {
                    model: Alert,
                    as: 'alert',
                    attributes: ['id', 'status', 'category', 'description']
                },
                {
                    model: RescueMember,
                    as: 'rescueMember',
                    attributes: ['id', 'position', 'badge_number']
                }
            ]
        });

        logData.message = "Statut de l'intervention mis à jour avec succès";
        logData.status = "SUCCESS";
        logData.responseData = updatedIntervention;
        await Logger.logEvent(logData);

        return ApiResponse.success(res, logData.message, updatedIntervention);

    } catch (error) {
        logData.message = "Erreur lors de la mise à jour du statut de l'intervention";
        logData.status = "FAILED";
        logData.responseData = { error: error.message };
        await Logger.logEvent(logData);

        return ApiResponse.serverError(res, logData.message, error.message);
    }
});

// Fonction utilitaire pour valider les transitions de statut
function validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
        'EN_ROUTE': ['SUR_PLACE', 'ANNULEE'],
        'SUR_PLACE': ['TERMINEE', 'ANNULEE'],
        'TERMINEE': [], // Pas de transition possible depuis TERMINEE
        'ANNULEE': []  // Pas de transition possible depuis ANNULEE
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
}

module.exports = router;