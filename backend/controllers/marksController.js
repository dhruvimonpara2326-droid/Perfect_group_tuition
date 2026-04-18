const Marks = require('../models/Marks');

// POST /api/marks
const addMarks = async (req, res) => {
  try {
    const { studentId, standard, batch, subject, examType, totalMarks, obtainedMarks, date, remarks } = req.body;

    if (!studentId || !standard || !subject || !examType || totalMarks === undefined || obtainedMarks === undefined) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    if (totalMarks < 0 || obtainedMarks < 0) {
      return res.status(400).json({ message: 'Marks cannot be negative' });
    }

    if (obtainedMarks > totalMarks) {
      return res.status(400).json({ message: 'Obtained marks cannot exceed total marks' });
    }

    const marks = await Marks.create({
      studentId,
      standard,
      batch,
      subject,
      examType,
      totalMarks,
      obtainedMarks,
      date,
      remarks,
      addedBy: req.user._id
    });

    res.status(201).json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/marks/:id
const updateMarks = async (req, res) => {
  try {
    const { totalMarks, obtainedMarks } = req.body;
    
    if (totalMarks !== undefined || obtainedMarks !== undefined) {
      const existing = await Marks.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: 'Marks record not found' });
      }
      
      const newTotal = totalMarks !== undefined ? totalMarks : existing.totalMarks;
      const newObtained = obtainedMarks !== undefined ? obtainedMarks : existing.obtainedMarks;

      if (newTotal < 0 || newObtained < 0) {
        return res.status(400).json({ message: 'Marks cannot be negative' });
      }
      if (newObtained > newTotal) {
        return res.status(400).json({ message: 'Obtained marks cannot exceed total marks' });
      }
    }

    const marks = await Marks.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!marks) {
      return res.status(404).json({ message: 'Marks record not found' });
    }
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/marks?studentId=...&standard=...&examType=...
const getMarks = async (req, res) => {
  try {
    const { studentId, standard, examType, subject, batch } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (standard) filter.standard = standard;
    if (examType) filter.examType = examType;
    if (subject) filter.subject = subject;
    if (batch) filter.batch = batch;

    const marks = await Marks.find(filter)
      .populate('studentId', 'name rollNo username standard batch')
      .sort({ date: -1 });

    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/marks/result/:studentId
const getStudentResult = async (req, res) => {
  try {
    const { studentId } = req.params;
    const marks = await Marks.find({ studentId }).sort({ subject: 1, date: -1 });

    // Group by subject
    const subjects = {};
    marks.forEach(m => {
      if (!subjects[m.subject]) {
        subjects[m.subject] = [];
      }
      subjects[m.subject].push(m);
    });

    // Calculate overall
    let totalObtained = 0;
    let totalMax = 0;
    marks.forEach(m => {
      totalObtained += m.obtainedMarks;
      totalMax += m.totalMarks;
    });

    const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

    res.json({
      subjects,
      totalObtained,
      totalMax,
      percentage,
      totalExams: marks.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/marks/:id
const deleteMarks = async (req, res) => {
  try {
    const marks = await Marks.findByIdAndDelete(req.params.id);
    if (!marks) {
      return res.status(404).json({ message: 'Marks record not found' });
    }
    res.json({ message: 'Marks record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addMarks, updateMarks, getMarks, getStudentResult, deleteMarks };
