const Fees = require('../models/Fees');
const Notification = require('../models/Notification');
const User = require('../models/User');

// POST /api/fees
const addFeeRecord = async (req, res) => {
  try {
    const { standard, totalAmount, academicYear } = req.body;

    if (!standard || !totalAmount) {
      return res.status(400).json({ message: 'Standard and total amount are required' });
    }

    const students = await User.find({ role: 'student', standard });

    if (students.length === 0) {
      return res.status(404).json({ message: `No students found in Standard ${standard}` });
    }

    const year = academicYear || '2025-2026';
    let addedCount = 0;
    let skippedCount = 0;

    for (const student of students) {
      const existing = await Fees.findOne({ studentId: student._id, academicYear: year });
      if (existing) {
        skippedCount++;
        continue;
      }

      await Fees.create({
        studentId: student._id,
        totalAmount,
        dueAmount: totalAmount,
        standard: student.standard,
        batch: student.batch,
        academicYear: year
      });
      addedCount++;
    }

    res.status(201).json({
      message: `Generated fees for ${addedCount} students. ${skippedCount > 0 ? `(${skippedCount} skipped as they already had records)` : ''}`,
      addedCount,
      skippedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/fees/:id/pay
const recordPayment = async (req, res) => {
  try {
    const { amount, method, note } = req.body;
    const fee = await Fees.findById(req.params.id);

    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required' });
    }

    fee.payments.push({
      amount,
      date: new Date().toISOString().split('T')[0],
      method: method || 'cash',
      note
    });

    fee.paidAmount += amount;
    fee.dueAmount = fee.totalAmount - fee.paidAmount;

    if (fee.dueAmount <= 0) {
      fee.status = 'paid';
      fee.dueAmount = 0;
    } else {
      fee.status = 'partial';
    }

    await fee.save();
    res.json(fee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/fees?studentId=...&status=...
const getFees = async (req, res) => {
  try {
    const { studentId, status, standard, batch } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;
    if (standard) filter.standard = standard;
    if (batch) filter.batch = batch;

    const fees = await Fees.find(filter)
      .populate('studentId', 'name rollNo username standard batch')
      .sort({ createdAt: -1 });

    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/fees/notify-due
const notifyDueFees = async (req, res) => {
  try {
    const dueFees = await Fees.find({ status: { $in: ['due', 'partial'] } })
      .populate('studentId', 'name rollNo');

    const notifications = [];
    for (const fee of dueFees) {
      if (!fee.studentId) continue;
      const notif = await Notification.create({
        userId: fee.studentId._id,
        title: 'Fee Payment Reminder',
        message: `You have a pending fee of ₹${fee.dueAmount}. Please pay at the earliest.`,
        type: 'fee_due',
        forRole: 'student'
      });
      notifications.push(notif);
    }

    res.json({ message: `Notifications sent to ${notifications.length} students`, notifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/fees/:id
const updateFeeRecord = async (req, res) => {
  try {
    const fee = await Fees.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }
    res.json(fee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addFeeRecord, recordPayment, getFees, notifyDueFees, updateFeeRecord };
