const express = require('express');
const router = express.Router();
const { creerSignalement, getAllSignalements } = require('../controllers/signalementController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.post('/', protect, creerSignalement);
router.get('/admin/all', protect, adminOnly, getAllSignalements);

module.exports = router;
