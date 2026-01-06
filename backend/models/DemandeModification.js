const mongoose = require('mongoose');

const demandeModificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['modification', 'suppression'],
        required: true,
    },
    recette: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recette',
        required: true,
    },
    auteur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utilisateur',
        required: true,
    },
    statut: {
        type: String,
        enum: ['EN_ATTENTE', 'APPROUVEE', 'REFUSEE'],
        default: 'EN_ATTENTE',
    },
    // Données de modification (si type === 'modification')
    modifications: {
        titre: String,
        description: String,
        categorie: String,
        tempsPreparation: Number,
        difficulte: String,
        portions: Number,
        ingredients: [{
            nom: String,
            quantite: String,
            unite: String,
        }],
        etapes: [{
            ordre: Number,
            description: String,
        }],
        image: String,
    },
    raisonRefus: {
        type: String,
        default: '',
    },
    dateCreation: {
        type: Date,
        default: Date.now,
    },
    dateTraitement: {
        type: Date,
    },
});

module.exports = mongoose.model('DemandeModification', demandeModificationSchema);

