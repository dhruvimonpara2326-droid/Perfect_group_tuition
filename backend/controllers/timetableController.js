const Timetable = require('../models/Timetable');

// POST /api/timetable
const createEntry = async (req, res) => {
  try {
    const { day, time, subject, facultyId, facultyName, standard, batch, type, room } = req.body;

    if (!day || !time || !subject || !standard || !type) {
      return res.status(400).json({ message: 'Day, time, subject, standard and type are required' });
    }

    const entry = await Timetable.create({
      day,
      time,
      subject,
      facultyId,
      facultyName,
      standard,
      batch,
      type,
      room,
      createdBy: req.user._id
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/timetable?standard=...&type=...&facultyId=...
const getTimetable = async (req, res) => {
  try {
    const { standard, type, facultyId, batch } = req.query;
    const filter = {};
    if (standard) filter.standard = standard;
    if (type) filter.type = type;
    if (facultyId) filter.facultyId = facultyId;
    if (batch) filter.batch = batch;

    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const entries = await Timetable.find(filter)
      .populate('facultyId', 'name subject')
      .sort({ time: 1 });

    // Sort by day order
    entries.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/timetable/:id
const updateEntry = async (req, res) => {
  try {
    const entry = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!entry) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/timetable/:id
const deleteEntry = async (req, res) => {
  try {
    const entry = await Timetable.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }
    res.json({ message: 'Timetable entry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createEntry, getTimetable, updateEntry, deleteEntry };
