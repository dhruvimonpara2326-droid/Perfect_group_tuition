const express = require('express');
const router = express.Router();
const { createEntry, getTimetable, updateEntry, deleteEntry } = require('../controllers/timetableController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('admin'), createEntry);
router.put('/:id', protect, authorize('admin'), updateEntry);
router.delete('/:id', protect, authorize('admin'), deleteEntry);
router.get('/', protect, getTimetable);

module.exports = router;
