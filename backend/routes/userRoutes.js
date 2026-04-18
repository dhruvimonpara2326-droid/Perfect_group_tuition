const express = require('express');
const router = express.Router();
const { getStudents, getFaculty, createFaculty, updateUser, deleteUser, getDashboardStats } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/students', protect, getStudents);
router.get('/faculty', protect, getFaculty);
router.get('/stats', protect, authorize('admin'), getDashboardStats);
router.post('/faculty', protect, authorize('admin'), createFaculty);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
