const express = require('express');
const router = express.Router();
const { addFeeRecord, recordPayment, getFees, notifyDueFees, updateFeeRecord } = require('../controllers/feesController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('admin'), addFeeRecord);
router.put('/:id', protect, authorize('admin'), updateFeeRecord);
router.put('/:id/pay', protect, authorize('admin'), recordPayment);
router.get('/', protect, getFees);
router.post('/notify-due', protect, authorize('admin'), notifyDueFees);

module.exports = router;
