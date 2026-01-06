const express = require('express');
const router = express.Router();
const {
    syncUser,
    getProfil,
    getStats,
    getAllUtilisateurs,
    changerRole,
    deleteUtilisateur,
    syncAllUsersFromFirebase,
    getFavoris,
    addFavori,
    removeFavori,
    cleanupFirebaseUsers
} = require('../controllers/utilisateurController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Routes Publiques/User
router.post('/sync', protect, syncUser);
router.get('/profil', protect, getProfil);
router.get('/favoris', protect, getFavoris);
router.post('/favoris', protect, addFavori);
router.delete('/favoris/:recetteId', protect, removeFavori);

// Routes Admin
router.get('/admin/stats', protect, adminOnly, getStats);
router.get('/admin/all', protect, adminOnly, getAllUtilisateurs);
router.post('/admin/sync-all', protect, adminOnly, syncAllUsersFromFirebase);
router.post('/admin/cleanup-firebase', protect, adminOnly, cleanupFirebaseUsers); // New logic
router.patch('/admin/:id/role', protect, adminOnly, changerRole);
router.delete('/admin/:id', protect, adminOnly, deleteUtilisateur);

module.exports = router;
