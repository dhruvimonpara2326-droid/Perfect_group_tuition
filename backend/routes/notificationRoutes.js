const express = require('express');
const router = express.Router();
const { getNotifications, createNotification, markAsRead, updateNotification, deleteNotification } = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getNotifications);
router.post('/', protect, authorize('admin'), createNotification);
router.put('/:id/read', protect, markAsRead);
router.put('/:id', protect, authorize('admin'), updateNotification);
router.delete('/:id', protect, authorize('admin'), deleteNotification);

module.exports = router;
