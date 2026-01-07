const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    destinataire: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utilisateur',
        required: true
    },
    emetteur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utilisateur'
    },
    type: {
        type: String,
        enum: ['NOUVEAU_COMMENTAIRE', 'RECETTE_APPROUVEE', 'RECETTE_REFUSEE', 'MODIFICATION_APPROUVEE', 'MODIFICATION_REFUSEE', 'SYSTEME'],
        required: true
    },
    titre: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    recetteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recette'
    },
    lu: {
        type: Boolean,
        default: false
    },
    dateCreation: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
