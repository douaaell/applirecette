const Signalement = require('../models/Signalement');
const Utilisateur = require('../models/Utilisateur');
const notificationController = require('./notificationController');

exports.creerSignalement = async (req, res) => {
    try {
        const { type, cibleId, motif } = req.body;
        const signalement = await Signalement.create({
            type,
            cibleId,
            auteur: req.user._id,
            motif
        });

        // Notifier tous les admins
        const admins = await Utilisateur.find({ role: 'ADMIN' });
        for (const admin of admins) {
            await notificationController.creerNotification(
                admin._id,
                req.user._id,
                'SYSTEME',
                'Nouveau contenu signalé',
                `Un ${type.toLowerCase()} a été signalé pour : ${motif}`,
                type === 'RECETTE' ? cibleId : null
            );
        }

        res.status(201).json(signalement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAllSignalements = async (req, res) => {
    try {
        const signalements = await Signalement.find({}).populate('auteur', 'nom prenom');
        res.json(signalements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
