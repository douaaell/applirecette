const Commentaire = require('../models/Commentaire');
const Recette = require('../models/Recette');
const notificationController = require('./notificationController');

// @desc    Obtenir les commentaires d'une recette
// @route   GET /api/commentaires/:recetteId
// @access  Public
const getCommentairesByRecette = async (req, res) => {
    try {
        const commentaires = await Commentaire.find({ recette: req.params.recetteId })
            .populate('utilisateur', 'nom prenom')
            .sort({ date: -1 });

        res.json(commentaires);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Ajouter un commentaire
// @route   POST /api/commentaires
// @access  Privé
const addCommentaire = async (req, res) => {
    try {
        const { contenu, note, parentCommentaire } = req.body;
        // Accepter soit recetteId (convention backend) soit recette (envoyé par le front)
        const recetteId = req.body.recetteId || req.body.recette;

        if (!recetteId) {
            return res.status(400).json({ message: 'ID de recette manquant' });
        }

        const commentaire = await Commentaire.create({
            utilisateur: req.user._id,
            recette: recetteId,
            contenu,
            note,
            parentCommentaire: parentCommentaire || null
        });

        // On peuple l'utilisateur pour le renvoi direct au front
        await commentaire.populate('utilisateur', 'nom prenom');

        // Envoyer une notification à l'auteur de la recette
        const recette = await Recette.findById(recetteId);
        if (recette && recette.auteur.toString() !== req.user._id.toString()) {
            await notificationController.creerNotification(
                recette.auteur,
                req.user._id,
                'NOUVEAU_COMMENTAIRE',
                'Nouveau commentaire',
                `${req.user.prenom} ${req.user.nom} a commenté votre recette "${recette.titre}"`,
                recette._id
            );
        }

        // Envoyer une notification si c'est une réponse
        if (parentCommentaire) {
            const parent = await Commentaire.findById(parentCommentaire);
            if (parent && parent.utilisateur.toString() !== req.user._id.toString()) {
                await notificationController.creerNotification(
                    parent.utilisateur,
                    req.user._id,
                    'NOUVEAU_COMMENTAIRE',
                    'Nouvelle réponse',
                    `${req.user.prenom} ${req.user.nom} a répondu à votre commentaire.`,
                    recetteId
                );
            }
        }

        res.status(201).json(commentaire);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Modifier un commentaire
// @route   PUT /api/commentaires/:id
// @access  Privé (Auteur)
const updateCommentaire = async (req, res) => {
    console.log('PUT /api/commentaires/' + req.params.id, req.body);
    try {
        const { contenu, note } = req.body;
        const commentaire = await Commentaire.findById(req.params.id);

        if (!commentaire) {
            return res.status(404).json({ message: 'Commentaire non trouvé' });
        }

        // Vérifier que c'est bien l'auteur
        const isAuthor = commentaire.utilisateur.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'ADMIN';

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ message: 'Non autorisé à modifier ce commentaire' });
        }

        const updatedCommentaire = await Commentaire.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    contenu: contenu || commentaire.contenu,
                    note: note || commentaire.note
                }
            },
            { new: true }
        ).populate('utilisateur', 'nom prenom');

        res.json(updatedCommentaire);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Supprimer un commentaire
// @route   DELETE /api/commentaires/:id
// @access  Privé (Auteur ou Admin)
const deleteCommentaire = async (req, res) => {
    console.log('DELETE /api/commentaires/' + req.params.id);
    try {
        const commentaire = await Commentaire.findById(req.params.id);

        if (!commentaire) {
            return res.status(404).json({ message: 'Commentaire non trouvé' });
        }

        // Vérifier droits : Auteur ou Admin
        if (commentaire.utilisateur.toString() === req.user._id.toString() || req.user.role === 'ADMIN') {
            await commentaire.deleteOne();
            res.json({ message: 'Commentaire supprimé' });
        } else {
            res.status(403).json({ message: 'Non autorisé' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Obtenir les commentaires de l'utilisateur connecté
// @route   GET /api/commentaires/mes-commentaires
// @access  Privé
const getMesCommentaires = async (req, res) => {
    try {
        const commentaires = await Commentaire.find({ utilisateur: req.user._id })
            .populate('recette', 'titre')
            .sort({ date: -1 });

        res.json(commentaires);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Obtenir tous les commentaires (ADMIN)
// @route   GET /api/commentaires/admin/all
// @access  Privé/Admin
const getAllCommentaires = async (req, res) => {
    try {
        const commentaires = await Commentaire.find({})
            .populate('utilisateur', 'nom prenom')
            .populate('recette', 'titre')
            .sort({ date: -1 });
        res.json(commentaires);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCommentairesByRecette,
    addCommentaire,
    updateCommentaire,
    deleteCommentaire,
    getMesCommentaires,
    getAllCommentaires
};
