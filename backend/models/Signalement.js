const mongoose = require('mongoose');

const signalementSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['RECETTE', 'COMMENTAIRE'],
        required: true
    },
    cibleId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    motif: {
        type: String,
        required: true
    },
    auteur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utilisateur',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Signalement', signalementSchema);
