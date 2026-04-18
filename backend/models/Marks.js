const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  standard: {
    type: String,
    required: true
  },
  batch: {
    type: String
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  examType: {
    type: String,
    enum: ['unit_test', 'mid_term', 'final', 'weekly_test', 'practice'],
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  obtainedMarks: {
    type: Number,
    required: true
  },
  date: {
    type: String
  },
  remarks: {
    type: String,
    trim: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Marks', marksSchema);
