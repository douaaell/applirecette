const mongoose = require('mongoose');

const recetteSchema = new mongoose.Schema({
    titre: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
    },
    image: {
        type: String, // URL ou base64
        required: false,
    },
    categorie: {
        type: String,
        required: true,
        enum: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON', 'AUTRE', 'entrees', 'plats', 'desserts', 'boissons', 'salades', 'soupes', 'petit-dejeuner', 'vegetarien', 'vegan', 'PLATS', 'ENTREES', 'DESSERTS', 'BOISSONS', 'SALADES', 'SOUPES', 'PETIT-DEJEUNER', 'VEGETARIEN', 'VEGAN'],
    },
    tempsPreparation: {
        type: Number, // en minutes
        required: true,
    },
    difficulte: {
        type: String,
        required: true,
        enum: ['FACILE', 'MOYEN', 'DIFFICILE', 'facile', 'moyen', 'difficile'],
    },
    portions: {
        type: Number,
        required: true,
        default: 4,
    },
    ingredients: [{
        nom: String,
        quantite: String,
        unite: String,
    }],
    etapes: [{
        ordre: Number,
        description: String,
    }],
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
    raisonRefus: {
        type: String,
        default: '',
    },
    favorisPar: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utilisateur',
    }],
    noteMoyenne: {
        type: Number,
        default: 0,
    },
    vues: {
        type: Number,
        default: 0,
    },
    dateCreation: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Recette', recetteSchema);
