const Notification = require('../models/Notification');
const Utilisateur = require('../models/Utilisateur');
const Recette = require('../models/Recette');

// Récupérer toutes les notifications d'un utilisateur
const getMesNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ destinataire: req.user.id })
            .sort({ dateCreation: -1 })
            .populate('emetteur', 'nom prenom photo')
            .populate('recetteId', 'titre');

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des notifications', error: error.message });
    }
};

// Marquer une notification comme lue
const marquerCommeLue = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }

        if (notification.destinataire.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        notification.lu = true;
        await notification.save();

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour de la notification', error: error.message });
    }
};

// Marquer toutes les notifications comme lues
const marquerToutesCommeLues = async (req, res) => {
    try {
        await Notification.updateMany(
            { destinataire: req.user.id, lu: false },
            { $set: { lu: true } }
        );
        res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour des notifications', error: error.message });
    }
};

// Supprimer une notification
const supprimerNotification = async (req, res) => {
    try {
        // Simplified deletion: find and delete by ID and ensure it belongs to the user
        const result = await Notification.findOneAndDelete({ _id: req.params.id, destinataire: req.user.id });

        if (!result) {
            return res.status(404).json({ message: 'Notification non trouvée ou non autorisée' });
        }
        res.json({ message: 'Notification supprimée' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression', error: error.message });
    }
};

// Créer une notification (utilitaire interne)
const creerNotification = async (destinataire, emetteur, type, titre, message, recetteId) => {
    try {
        const nouvelleNotification = new Notification({
            destinataire,
            emetteur,
            type,
            titre,
            message,
            recetteId
        });
        await nouvelleNotification.save();
        return nouvelleNotification;
    } catch (error) {
        console.error('Erreur lors de la création de la notification:', error);
    }
};

/**
 * Notifier tous les utilisateurs (pour Recette du Jour, News, etc.)
 */
const notifierTousLesUtilisateurs = async (titre, message, recetteId = null) => {
    try {
        const utilisateurs = await Utilisateur.find({ role: 'USER' });
        const notifications = utilisateurs.map(u => ({
            destinataire: u._id,
            type: 'ANNOUNCE',
            titre,
            message,
            recetteId,
            lu: false
        }));
        await Notification.insertMany(notifications);
        return true;
    } catch (error) {
        console.error('Erreur notification globale:', error);
        return false;
    }
};

module.exports = {
    getMesNotifications,
    marquerCommeLue,
    marquerToutesCommeLues,
    supprimerNotification,
    creerNotification,
    notifierTousLesUtilisateurs
};
