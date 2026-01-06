const mongoose = require('mongoose');

const utilisateurSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: true,
        unique: true, // ID Firebase
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    nom: {
        type: String,
        required: true,
    },
    prenom: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['USER', 'ADMIN'],
        default: 'USER',
        // Ne pas appliquer la valeur par défaut si le champ existe déjà
        required: false,
    },
    dateInscription: {
        type: Date,
        default: Date.now,
    },
    favoris: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recette'
    }]
});

module.exports = mongoose.model('Utilisateur', utilisateurSchema);
