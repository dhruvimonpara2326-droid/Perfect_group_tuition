const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadClasswork, getClasswork, updateClasswork, deleteClasswork } = require('../controllers/classworkController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, PPT, images and text files are allowed'));
    }
  }
});

router.post('/', protect, authorize('admin', 'faculty'), upload.single('file'), uploadClasswork);
router.put('/:id', protect, authorize('admin', 'faculty'), upload.single('file'), updateClasswork);
router.delete('/:id', protect, authorize('admin', 'faculty'), deleteClasswork);
router.get('/', protect, getClasswork);

module.exports = router;
