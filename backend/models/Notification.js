const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['fee_due', 'result', 'general', 'timetable', 'classwork'],
    default: 'general'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  forRole: {
    type: String,
    enum: ['student', 'faculty', 'all']
  },
  forStandard: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
