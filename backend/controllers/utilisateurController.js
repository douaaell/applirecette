// backend/controllers/utilisateurController.js
const Utilisateur = require('../models/Utilisateur');
const Recette = require('../models/Recette');
const Commentaire = require('../models/Commentaire');
const admin = require('../config/firebaseAdmin');
const notificationController = require('./notificationController');

const syncUser = async (req, res) => {
    if (!req.userFirebase || !req.userFirebase.uid) {
        return res.status(400).json({ message: 'Données utilisateur manquantes' });
    }

    const { uid, email } = req.userFirebase;
    const { nom, prenom } = req.body;

    try {
        let utilisateur = await Utilisateur.findOne({ uid });

        if (!utilisateur) {
            const userData = {
                uid,
                email: email || `${uid}@applirecette.com`,
                nom: nom || 'Utilisateur',
                prenom: prenom || 'Utilisateur',
                role: 'USER'
            };
            utilisateur = new Utilisateur(userData);
            await utilisateur.save();
        } else {
            const roleAvant = utilisateur.role;
            if (nom || prenom) {
                if (nom) utilisateur.nom = nom;
                if (prenom) utilisateur.prenom = prenom;
                await utilisateur.save();
            }
            if (utilisateur.role !== roleAvant) {
                utilisateur.role = roleAvant;
                await utilisateur.save();
            }
        }
        res.json(utilisateur);

    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

const getProfil = async (req, res) => {
    if (req.user) {
        const utilisateurFrais = await Utilisateur.findById(req.user._id);
        if (!utilisateurFrais) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        return res.json(utilisateurFrais);
    }
    return res.status(404).json({ message: 'Utilisateur non trouvé' });
};

const getFavoris = async (req, res) => {
    try {
        const user = await Utilisateur.findById(req.user._id).populate('favoris');
        res.json(user.favoris || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addFavori = async (req, res) => {
    try {
        const { recetteId } = req.body;
        const user = await Utilisateur.findById(req.user._id);

        if (!user.favoris.includes(recetteId)) {
            user.favoris.push(recetteId);
            await user.save();

            const recette = await Recette.findById(recetteId);
            if (recette && recette.auteur.toString() !== req.user._id.toString()) {
                await notificationController.creerNotification(
                    recette.auteur,
                    req.user._id,
                    'SYSTEME',
                    'Nouveau favori !',
                    `${req.user.prenom} ${req.user.nom} a ajouté votre recette "${recette.titre}" à ses favoris.`,
                    recette._id
                );
            }
        }
        await user.populate('favoris');
        res.json(user.favoris);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const removeFavori = async (req, res) => {
    try {
        const recetteId = req.params.recetteId;
        const user = await Utilisateur.findById(req.user._id);
        user.favoris = user.favoris.filter(id => id.toString() !== recetteId);
        await user.save();
        await user.populate('favoris');
        res.json(user.favoris);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getStats = async (req, res) => {
    try {
        const totalUtilisateurs = await Utilisateur.countDocuments();
        const totalRecettesApprouvees = await Recette.countDocuments({ statut: 'APPROUVEE' });
        const totalRecettesEnAttente = await Recette.countDocuments({ statut: 'EN_ATTENTE' });
        const totalCommentaires = await Commentaire.countDocuments();
        return res.json({ totalUtilisateurs, totalRecettesApprouvees, totalRecettesEnAttente, totalCommentaires });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getAllUtilisateurs = async (req, res) => {
    try {
        const utilisateurs = await Utilisateur.find({}).sort({ createdAt: -1 });
        res.json(utilisateurs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const changerRole = async (req, res) => {
    try {
        const { role } = req.body;
        const utilisateur = await Utilisateur.findById(req.params.id);
        if (!utilisateur) return res.status(404).json({ message: 'Utilisateur non trouvé' });
        utilisateur.role = role;
        await utilisateur.save();

        await notificationController.creerNotification(
            utilisateur._id,
            req.user._id,
            'SYSTEME',
            'Mise à jour de profil',
            `Un administrateur a mis à jour votre rôle. Vous êtes maintenant : ${role}.`,
            null
        );
        res.json(utilisateur);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteUtilisateur = async (req, res) => {
    try {
        const utilisateur = await Utilisateur.findById(req.params.id);
        if (!utilisateur) return res.status(404).json({ message: 'Utilisateur non trouvé' });
        if (utilisateur.uid) {
            try {
                await admin.auth().deleteUser(utilisateur.uid);
            } catch (fError) {
                console.warn('Firebase error:', fError.message);
            }
        }
        await utilisateur.deleteOne();
        res.json({ message: 'Utilisateur supprimé' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const syncAllUsersFromFirebase = async (req, res) => {
    try {
        let allFirebaseUsers = [];
        let nextPageToken = undefined;
        do {
            let result = await admin.auth().listUsers(1000, nextPageToken);
            allFirebaseUsers = allFirebaseUsers.concat(result.users);
            nextPageToken = result.pageToken;
        } while (nextPageToken);

        for (const userRecord of allFirebaseUsers) {
            const { uid, email, displayName } = userRecord;
            let utilisateur = await Utilisateur.findOne({ uid });
            if (!utilisateur) {
                const nameParts = (displayName || 'Utilisateur').split(' ');
                utilisateur = new Utilisateur({
                    uid,
                    email: email || `${uid}@applirecette.com`,
                    nom: nameParts.slice(1).join(' ') || 'Utilisateur',
                    prenom: nameParts[0] || 'Utilisateur',
                    role: 'USER'
                });
                await utilisateur.save();
            }
        }
        res.json({ message: 'Synchronisation terminée' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const cleanupFirebaseUsers = async (req, res) => {
    try {
        const mongoUsers = await Utilisateur.find({}, 'uid');
        const mongoUids = new Set(mongoUsers.map(u => u.uid).filter(Boolean));
        let allFirebaseUsers = [];
        let nextPageToken = undefined;
        do {
            let result = await admin.auth().listUsers(1000, nextPageToken);
            allFirebaseUsers = allFirebaseUsers.concat(result.users);
            nextPageToken = result.pageToken;
        } while (nextPageToken);

        const currentAdminUid = req.userFirebase ? req.userFirebase.uid : null;
        for (const user of allFirebaseUsers) {
            if (user.uid !== currentAdminUid && !mongoUids.has(user.uid)) {
                await admin.auth().deleteUser(user.uid);
            }
        }
        res.json({ message: 'Nettoyage terminé' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    syncUser,
    getProfil,
    getStats,
    getAllUtilisateurs,
    changerRole,
    deleteUtilisateur,
    syncAllUsersFromFirebase,
    getFavoris,
    addFavori,
    removeFavori,
    cleanupFirebaseUsers
};
