const express = require('express');
const router = express.Router();
const { addMarks, updateMarks, getMarks, getStudentResult, deleteMarks } = require('../controllers/marksController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('admin'), addMarks);
router.put('/:id', protect, authorize('admin'), updateMarks);
router.delete('/:id', protect, authorize('admin'), deleteMarks);
router.get('/', protect, getMarks);
router.get('/result/:studentId', protect, getStudentResult);

module.exports = router;
