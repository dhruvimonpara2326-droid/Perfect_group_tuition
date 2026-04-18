const Attendance = require('../models/Attendance');
const User = require('../models/User');

// POST /api/attendance/mark
const markAttendance = async (req, res) => {
  try {
    const { records, date } = req.body;
    // records: [{ userId, status }]

    if (!records || !date) {
      return res.status(400).json({ message: 'Records and date are required' });
    }

    const results = [];
    for (const record of records) {
      try {
        const user = await User.findById(record.userId);
        if (!user) continue;

        const existing = await Attendance.findOne({ userId: record.userId, date });
        if (existing) {
          existing.status = record.status;
          await existing.save();
          results.push(existing);
        } else {
          const attendance = await Attendance.create({
            userId: record.userId,
            date,
            status: record.status,
            role: user.role,
            standard: user.standard,
            batch: user.batch,
            markedBy: req.user._id
          });
          results.push(attendance);
        }
      } catch (err) {
        // Skip duplicates or errors for individual records
        continue;
      }
    }

    res.json({ message: 'Attendance marked successfully', count: results.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/attendance?userId=...&month=...&year=...
const getAttendance = async (req, res) => {
  try {
    const { userId, standard, batch, role, month, year, date } = req.query;
    const filter = {};

    if (userId) filter.userId = userId;
    if (standard) filter.standard = standard;
    if (batch) filter.batch = batch;
    if (role) filter.role = role;

    // Filter by single date
    if (date) {
      filter.date = date;
    } else if (month && year) {
      // Filter by month/year if provided (date format: YYYY-MM-DD)
      const monthStr = month.padStart(2, '0');
      filter.date = { $regex: `^${year}-${monthStr}` };
    }

    const attendance = await Attendance.find(filter)
      .populate('userId', 'name rollNo username')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/attendance/summary/:userId
const getAttendanceSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    const total = await Attendance.countDocuments({ userId });
    const present = await Attendance.countDocuments({ userId, status: 'present' });
    const absent = total - present;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    res.json({ total, present, absent, percentage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { markAttendance, getAttendance, getAttendanceSummary };
