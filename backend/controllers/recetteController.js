const Recette = require('../models/Recette');

// @desc    Récupérer toutes les recettes (filtres possibles)
// @route   GET /api/recettes
// @access  Public
const getRecettes = async (req, res) => {
    try {
        const { categorie, temps, difficulte, search } = req.query;
        // Par défaut, on affiche uniquement les recettes approuvées pour les utilisateurs non-admin
        let query = { statut: 'APPROUVEE' };

        if (categorie) query.categorie = categorie;
        if (difficulte) query.difficulte = difficulte;
        if (temps) query.tempsPreparation = { $lte: Number(temps) };
        if (search) {
            query.$or = [
                { titre: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const recettes = await Recette.find(query)
            .populate('auteur', 'nom prenom')
            .sort({ dateCreation: -1 });

        res.json(recettes);
    } catch (error) {
        console.error('❌ Erreur getRecettes:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Ajouter une recette
// @route   POST /api/recettes
// @access  Privé
const addRecette = async (req, res) => {
    try {
        // Gestion de l'image (fichier uploadé ou URL fournie)
        let imageUrl = req.body.image;
        if (req.file) {
            // URL complète pour l'accès
            const protocol = req.protocol;
            const host = req.get('host');
            imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
        }

        // Parse ingredients/etapes if they are strings (from multipart form-data)
        let ingredients = req.body.ingredients;
        if (typeof ingredients === 'string') {
            try { ingredients = JSON.parse(ingredients); } catch (e) { }
        }

        let etapes = req.body.etapes;
        if (typeof etapes === 'string') {
            try { etapes = JSON.parse(etapes); } catch (e) { }
        }

        // Convertir les données pour correspondre au modèle
        const recetteData = {
            ...req.body,
            image: imageUrl,
            ingredients: ingredients,
            // Convertir les étapes de tableau de strings vers tableau d'objets
            etapes: Array.isArray(etapes) ? etapes.map((etape, index) => ({
                ordre: index + 1,
                description: typeof etape === 'object' ? etape.description : etape
            })) : [],
            // Normaliser la catégorie (enlever le S si présent et mettre en majuscules)
            categorie: req.body.categorie ? req.body.categorie.replace(/S$/, '').toUpperCase() : 'PLAT',
            // Convertir la difficulté en majuscules
            difficulte: req.body.difficulte ? req.body.difficulte.toUpperCase() : 'FACILE',
            auteur: req.user._id,
            statut: 'EN_ATTENTE', // Toujours en attente au début
        };

        const recette = new Recette(recetteData);
        const createdRecette = await recette.save();
        // console.log('✅ Recette sauvegardée dans MongoDB ! ID:', createdRecette._id);
        res.status(201).json(createdRecette);
    } catch (error) {
        console.error('Erreur lors de l\'ajout de la recette:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Récupérer une recette par ID
// @route   GET /api/recettes/:id
// @access  Public
const getRecetteById = async (req, res) => {
    try {
        const recette = await Recette.findById(req.params.id).populate('auteur', 'nom prenom');
        if (recette) {
            // Incrémenter vues si besoin
            res.json(recette);
        } else {
            res.status(404).json({ message: 'Recette non trouvée' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Récupérer toutes les recettes (ADMIN)
// @route   GET /api/recettes/admin/all
// @access  Privé/Admin
const getAllRecettesAdmin = async (req, res) => {
    try {
        const recettes = await Recette.find({})
            .populate('auteur', 'nom prenom')
            .sort({ dateCreation: -1 });
        res.json(recettes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Valider/Refuser une recette (ADMIN)
// @route   PATCH /api/recettes/:id/valider
// @access  Privé/Admin
const validerRecette = async (req, res) => {
    try {
        const recette = await Recette.findById(req.params.id);
        if (recette) {
            // Sécurité absolue : si req.body est null/undefined, on utilise un objet vide
            const body = req.body || {};

            // console.log(`🔍 Validation Recette ${req.params.id} - Body reçu:`, body);

            // Si le statut est fourni, l'utiliser, sinon 'APPROUVEE' par défaut
            if (body && body.statut) {
                recette.statut = body.statut;
                if (body.raisonRefus) {
                    recette.raisonRefus = body.raisonRefus;
                } else if (body.statut === 'APPROUVEE') {
                    recette.raisonRefus = '';
                }
            } else {
                // Comportement par défaut : approuver
                recette.statut = 'APPROUVEE';
                recette.raisonRefus = '';
            }

            const updatedRecette = await recette.save();
            // console.log('✅ Recette validée/mise à jour:', updatedRecette?.statut);
            res.json(updatedRecette);
        } else {
            res.status(404).json({ message: 'Recette non trouvée' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Récupérer les recettes de l'utilisateur connecté
// @route   GET /api/recettes/mes-recettes
// @access  Privé
const getMesRecettes = async (req, res) => {
    try {
        // console.log(`📊 getMesRecettes - Recherche pour utilisateur ID: ${req.user._id}`);
        const recettes = await Recette.find({ auteur: req.user._id })
            .populate('auteur', 'nom prenom')
            .sort({ dateCreation: -1 });
        // console.log(`📊 getMesRecettes - ${recettes.length} recette(s) trouvée(s) pour cet utilisateur`);
        // console.log(`📊 getMesRecettes - Statuts:`, [...new Set(recettes.map(r => r.statut))]);
        res.json(recettes);
    } catch (error) {
        console.error('❌ Erreur getMesRecettes:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Modifier une recette
// @route   PUT /api/recettes/:id
// @access  Privé (Auteur ou Admin)
const updateRecette = async (req, res) => {
    try {
        // console.log('📝 Modification recette - ID:', req.params.id);

        const recette = await Recette.findById(req.params.id);
        if (!recette) {
            return res.status(404).json({ message: 'Recette non trouvée' });
        }

        // Vérifier les droits
        const isAuthor = recette.auteur.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'ADMIN';

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ message: 'Non autorisé à modifier cette recette' });
        }

        // Gestion de l'image (fichier uploadé ou URL fournie)
        let imageUrl = req.body.image;
        if (req.file) {
            // URL complète pour l'accès
            const protocol = req.protocol;
            const host = req.get('host');
            imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
        }

        // Parse ingredients/etapes if they are strings (from multipart form-data)
        let ingredients = req.body.ingredients;
        if (typeof ingredients === 'string') {
            try { ingredients = JSON.parse(ingredients); } catch (e) { }
        }

        let etapes = req.body.etapes;
        if (typeof etapes === 'string') {
            try { etapes = JSON.parse(etapes); } catch (e) { }
        }

        // Mettre à jour les champs
        if (req.body.titre) recette.titre = req.body.titre;
        if (req.body.categorie) recette.categorie = req.body.categorie.replace(/S$/, '').toUpperCase();
        if (req.body.difficulte) recette.difficulte = req.body.difficulte.toUpperCase();
        if (req.body.tempsPreparation) recette.tempsPreparation = parseInt(req.body.tempsPreparation) || 0;
        if (req.body.portions) recette.portions = parseInt(req.body.portions) || 1;
        if (imageUrl !== undefined) recette.image = imageUrl;
        if (ingredients) recette.ingredients = ingredients;
        if (etapes) {
            recette.etapes = Array.isArray(etapes) ? etapes.map((etape, index) => ({
                ordre: index + 1,
                description: typeof etape === 'object' ? etape.description : etape
            })) : [];
        }

        // En mode admin, on peut aussi changer le statut
        if (isAdmin && req.body.statut) {
            recette.statut = req.body.statut;
        }

        const updatedRecette = await recette.save();
        // console.log('✅ Recette modifiée avec succès ! ID:', updatedRecette._id);
        res.json(updatedRecette);
    } catch (error) {
        console.error('❌ Erreur modification recette:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Test endpoint pour vérifier toutes les recettes
// @route   GET /api/recettes/test
// @access  Public
const testRecettes = async (req, res) => {
    try {
        const toutes = await Recette.find({});
        const approuvees = await Recette.find({ statut: 'APPROUVEE' });
        const enAttente = await Recette.find({ statut: 'EN_ATTENTE' });

        // console.log('📊 Test - Toutes les recettes:', toutes.length);
        // console.log('📊 Test - Recettes approuvées:', approuvees.length);
        // console.log('📊 Test - Recettes en attente:', enAttente.length);

        res.json({
            total: toutes.length,
            approuvees: approuvees.length,
            enAttente: enAttente.length,
            toutes: toutes.map(r => ({ titre: r.titre, statut: r.statut })),
            approuvees: approuvees.map(r => ({ titre: r.titre, statut: r.statut }))
        });
    } catch (error) {
        console.error('❌ Erreur testRecettes:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Supprimer une recette
// @route   DELETE /api/recettes/:id
// @access  Privé (Admin ou auteur)
const deleteRecette = async (req, res) => {
    try {
        const recette = await Recette.findById(req.params.id);

        if (!recette) {
            return res.status(404).json({ message: 'Recette non trouvée' });
        }

        // Vérifier si l'utilisateur est admin ou l'auteur
        if (req.user.role !== 'ADMIN' && recette.auteur.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé à supprimer cette recette' });
        }

        await Recette.findByIdAndDelete(req.params.id);
        res.json({ message: 'Recette supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getRecettes,
    addRecette,
    getRecetteById,
    getAllRecettesAdmin,
    validerRecette,
    getMesRecettes,
    updateRecette,
    deleteRecette,
    testRecettes
};
