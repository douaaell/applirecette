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
    auteur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utilisateur',
        required: true
    },
    motif: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    resolu: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Signalement', signalementSchema);
