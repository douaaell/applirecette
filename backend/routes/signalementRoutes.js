const express = require('express');
const router = express.Router();
const { creerSignalement, getAllSignalements, supprimerSignalement } = require('../controllers/signalementController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.post('/', protect, creerSignalement);
router.get('/admin/all', protect, adminOnly, getAllSignalements);
router.delete('/admin/:id', protect, adminOnly, supprimerSignalement);

module.exports = router;
