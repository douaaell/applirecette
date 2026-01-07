const Signalement = require('../models/Signalement');
const Utilisateur = require('../models/Utilisateur');
const notificationController = require('./notificationController');

exports.creerSignalement = async (req, res) => {
    try {
        const { type, cibleId, motif } = req.body;
        const signalement = await Signalement.create({
            type,
            cibleId,
            motif,
            auteur: req.user._id
        });

        // Notifier les administrateurs
        try {
            const admins = await Utilisateur.find({ role: 'ADMIN' });
            for (const admin of admins) {
                await notificationController.creerNotification(
                    admin._id,
                    req.user._id,
                    'SYSTEME',
                    'Nouveau signalement',
                    `Un nouveau signalement pour ${type} a été créé par ${req.user.prenom} ${req.user.nom} pour le motif : ${motif}`,
                    type === 'RECETTE' ? cibleId : null
                );
            }
        } catch (notifyError) {
            console.error('Erreur lors de la notification des admins:', notifyError);
        }

        res.status(201).json(signalement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAllSignalements = async (req, res) => {
    try {
        const signalements = await Signalement.find()
            .populate('auteur', 'nom prenom')
            .sort({ date: -1 });
        res.json(signalements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
