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

// 1. ROUTES ADMIN (Spécifiques d'abord)
router.get('/admin/all', protect, adminOnly, getAllRecettesAdmin);
router.patch('/:id/valider', protect, adminOnly, validerRecette);
router.patch('/:id/refuser', protect, adminOnly, validerRecette);

// 2. ROUTES UTILISATEUR (Avant :id)
router.get('/mes-recettes', protect, getMesRecettes);
router.get('/test', testRecettes);
router.get('/search', getRecettes);

// 3. ROUTES GÉNÉRIQUES (:id en dernier)
router.get('/', getRecettes);
router.get('/:id', getRecetteById);
router.post('/', protect, upload.single('image'), addRecette);
router.put('/:id', protect, upload.single('image'), updateRecette);
router.delete('/:id', protect, deleteRecette);

module.exports = router;
