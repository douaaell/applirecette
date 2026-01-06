const express = require('express');
const router = express.Router();
const {
    addCommentaire,
    getCommentairesByRecette,
    updateCommentaire,
    deleteCommentaire,
    getMesCommentaires,
    getAllCommentaires // Admin
} = require('../controllers/commentaireController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Routes publiques
router.get('/recette/:recetteId', getCommentairesByRecette);

// Routes protégées (utilisateur connecté)
router.get('/mes-commentaires', protect, getMesCommentaires);
router.post('/', protect, addCommentaire);
router.put('/:id', protect, updateCommentaire);
router.delete('/:id', protect, deleteCommentaire);

// Routes admin
router.get('/admin/all', protect, adminOnly, getAllCommentaires);

module.exports = router;
