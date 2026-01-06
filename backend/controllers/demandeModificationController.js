const DemandeModification = require('../models/DemandeModification');
const Recette = require('../models/Recette');

// @desc    Créer une demande de modification ou suppression
// @route   POST /api/demandes-modification
// @access  Privé
const createDemande = async (req, res) => {
    try {
        const { type, recetteId, modifications } = req.body;

        if (!type || !recetteId) {
            return res.status(400).json({ message: 'Type et ID de recette requis' });
        }

        // Vérifier que la recette existe
        const recette = await Recette.findById(recetteId);
        if (!recette) {
            return res.status(404).json({ message: 'Recette non trouvée' });
        }

        // Vérifier que l'utilisateur est le propriétaire (sauf si admin)
        const isOwner = recette.auteur.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette recette' });
        }

        /* 
        // Si admin, appliquer directement (pas de demande) - DESACTIVE SUR DEMANDE UTILISATEUR
        if (isAdmin && type === 'modification') {
            // Appliquer les modifications directement
            const updatedRecette = await Recette.findByIdAndUpdate(
                recetteId,
                { $set: modifications },
                { new: true }
            );
            return res.json({ message: 'Modification appliquée directement (admin)', recette: updatedRecette });
        }

        if (isAdmin && type === 'suppression') {
            // Supprimer directement
            await Recette.findByIdAndDelete(recetteId);
            return res.json({ message: 'Recette supprimée directement (admin)' });
        }
        */

        // Créer la demande pour les utilisateurs normaux
        const demande = new DemandeModification({
            type,
            recette: recetteId,
            auteur: req.user._id,
            modifications: type === 'modification' ? modifications : undefined,
        });

        await demande.save();
        await demande.populate('recette', 'titre image');
        await demande.populate('auteur', 'nom prenom email');

        res.status(201).json(demande);
    } catch (error) {
        console.error('Erreur création demande:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Récupérer toutes les demandes (ADMIN)
// @route   GET /api/demandes-modification
// @access  Privé/Admin
const getAllDemandes = async (req, res) => {
    try {
        const demandes = await DemandeModification.find({ statut: 'EN_ATTENTE' })
            .populate('recette', 'titre image categorie')
            .populate('auteur', 'nom prenom email')
            .sort({ dateCreation: -1 });

        res.json(demandes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approuver une demande
// @route   PATCH /api/demandes-modification/:id/approuver
// @access  Privé/Admin
const approuverDemande = async (req, res) => {
    try {
        const demande = await DemandeModification.findById(req.params.id)
            .populate('recette')
            .populate('auteur');

        if (!demande) {
            return res.status(404).json({ message: 'Demande non trouvée' });
        }

        if (demande.statut !== 'EN_ATTENTE') {
            return res.status(400).json({ message: 'Cette demande a déjà été traitée' });
        }

        if (demande.type === 'modification') {
            // Appliquer les modifications
            const recette = await Recette.findByIdAndUpdate(
                demande.recette._id,
                { $set: demande.modifications },
                { new: true }
            );

            demande.statut = 'APPROUVEE';
            demande.dateTraitement = new Date();
            await demande.save();

            res.json({ message: 'Modification approuvée et appliquée', demande, recette });
        } else if (demande.type === 'suppression') {
            // Supprimer la recette
            await Recette.findByIdAndDelete(demande.recette._id);

            demande.statut = 'APPROUVEE';
            demande.dateTraitement = new Date();
            await demande.save();

            res.json({ message: 'Suppression approuvée et appliquée', demande });
        }
    } catch (error) {
        console.error('Erreur approbation demande:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Rejeter une demande
// @route   PATCH /api/demandes-modification/:id/rejeter
// @access  Privé/Admin
const rejeterDemande = async (req, res) => {
    try {
        const { raisonRefus } = req.body;

        const demande = await DemandeModification.findById(req.params.id);

        if (!demande) {
            return res.status(404).json({ message: 'Demande non trouvée' });
        }

        if (demande.statut !== 'EN_ATTENTE') {
            return res.status(400).json({ message: 'Cette demande a déjà été traitée' });
        }

        demande.statut = 'REFUSEE';
        demande.raisonRefus = raisonRefus || 'Demande refusée';
        demande.dateTraitement = new Date();
        await demande.save();

        res.json({ message: 'Demande rejetée', demande });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Récupérer les demandes d'un utilisateur
// @route   GET /api/demandes-modification/mes-demandes
// @access  Privé
const getMesDemandes = async (req, res) => {
    try {
        const demandes = await DemandeModification.find({ auteur: req.user._id })
            .populate('recette', 'titre image')
            .sort({ dateCreation: -1 });

        res.json(demandes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createDemande,
    getAllDemandes,
    approuverDemande,
    rejeterDemande,
    getMesDemandes,
};

