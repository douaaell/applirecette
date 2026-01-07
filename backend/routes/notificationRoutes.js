const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, notificationController.getMesNotifications);
router.put('/marquer-lue/:id', protect, notificationController.marquerCommeLue);
router.put('/tout-marquer-lu', protect, notificationController.marquerToutesCommeLues);
router.delete('/:id', protect, notificationController.supprimerNotification);

module.exports = router;
