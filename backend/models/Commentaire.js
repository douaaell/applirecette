const mongoose = require('mongoose');

const commentaireSchema = new mongoose.Schema({
    utilisateur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utilisateur',
        required: true,
    },
    recette: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recette',
        required: true,
    },
    contenu: {
        type: String,
        required: true,
    },
    note: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    parentCommentaire: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Commentaire',
        required: false,
    },
});

module.exports = mongoose.model('Commentaire', commentaireSchema);
