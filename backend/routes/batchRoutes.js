const express = require('express');
const router = express.Router();
const { getBatches, createBatch, updateBatch, deleteBatch } = require('../controllers/batchController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getBatches); // Public so students can fetch during registration
router.post('/', protect, authorize('admin'), createBatch);
router.put('/:id', protect, authorize('admin'), updateBatch);
router.delete('/:id', protect, authorize('admin'), deleteBatch);

module.exports = router;
