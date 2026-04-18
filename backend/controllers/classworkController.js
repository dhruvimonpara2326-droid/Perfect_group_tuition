const Classwork = require('../models/Classwork');

// POST /api/classwork
const uploadClasswork = async (req, res) => {
  try {
    const { title, description, subject, standard, batch, content } = req.body;

    if (!title || !subject || !standard) {
      return res.status(400).json({ message: 'Title, subject and standard are required' });
    }

    const classwork = await Classwork.create({
      title,
      description,
      subject,
      standard,
      batch,
      content,
      fileUrl: req.file ? `/uploads/${req.file.filename}` : null,
      fileName: req.file ? req.file.originalname : null,
      uploadedBy: req.user._id,
      uploaderName: req.user.name,
      uploaderRole: req.user.role
    });

    res.status(201).json(classwork);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/classwork?standard=...&subject=...
const getClasswork = async (req, res) => {
  try {
    const { standard, batch, subject, uploadedBy } = req.query;
    const filter = {};
    if (standard) filter.standard = standard;
    if (batch) filter.batch = batch;
    if (subject) filter.subject = subject;
    if (uploadedBy) filter.uploadedBy = uploadedBy;

    const classwork = await Classwork.find(filter)
      .populate('uploadedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json(classwork);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/classwork/:id
const updateClasswork = async (req, res) => {
  try {
    const classwork = await Classwork.findById(req.params.id);
    if (!classwork) {
      return res.status(404).json({ message: 'Classwork not found' });
    }

    // Faculty can only edit their own notes; admin can edit any
    if (req.user.role === 'faculty' && classwork.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own notes' });
    }

    const updates = req.body;
    if (req.file) {
      updates.fileUrl = `/uploads/${req.file.filename}`;
      updates.fileName = req.file.originalname;
    }

    const updated = await Classwork.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/classwork/:id
const deleteClasswork = async (req, res) => {
  try {
    const classwork = await Classwork.findById(req.params.id);
    if (!classwork) {
      return res.status(404).json({ message: 'Classwork not found' });
    }

    // Faculty can only delete their own notes; admin can delete any
    if (req.user.role === 'faculty' && classwork.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own notes' });
    }

    await Classwork.findByIdAndDelete(req.params.id);
    res.json({ message: 'Classwork deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadClasswork, getClasswork, updateClasswork, deleteClasswork };
