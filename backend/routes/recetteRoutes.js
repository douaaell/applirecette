const express = require('express');
const router = express.Router();
const {
    getRecettes,
    addRecette,
    getRecetteById,
    getAllRecettesAdmin,
    validerRecette,
    getMesRecettes,
    updateRecette,
    deleteRecette,
    testRecettes
} = require('../controllers/recetteController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public
router.get('/test', testRecettes); // Test endpoint - DOIT ÊTRE AVANT /:id
router.get('/', getRecettes);
router.get('/search', getRecettes); // Alias pour search

// Privé (Utilisateur) - PLACÉ AVANT /:id
router.get('/mes-recettes', protect, getMesRecettes);

router.get('/:id', getRecetteById);

// Privé (Utilisateur) - Actions
router.post('/', protect, upload.single('image'), addRecette);
router.put('/:id', protect, upload.single('image'), updateRecette);
router.delete('/:id', protect, deleteRecette);

// Privé (Admin)
router.get('/admin/all', protect, adminOnly, getAllRecettesAdmin);
router.patch('/:id/valider', protect, adminOnly, validerRecette);

module.exports = router;
