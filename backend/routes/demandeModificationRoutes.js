const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const {
    createDemande,
    getAllDemandes,
    approuverDemande,
    rejeterDemande,
    getMesDemandes,
} = require('../controllers/demandeModificationController');

// Routes publiques/privées
router.post('/', protect, createDemande);
router.get('/mes-demandes', protect, getMesDemandes);

// Routes admin
router.get('/', protect, adminOnly, getAllDemandes);
router.patch('/:id/approuver', protect, adminOnly, approuverDemande);
router.patch('/:id/rejeter', protect, adminOnly, rejeterDemande);

module.exports = router;

