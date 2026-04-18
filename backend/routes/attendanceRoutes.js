const express = require('express');
const router = express.Router();
const { markAttendance, getAttendance, getAttendanceSummary } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/mark', protect, authorize('admin'), markAttendance);
router.get('/', protect, getAttendance);
router.get('/summary/:userId', protect, getAttendanceSummary);

module.exports = router;
