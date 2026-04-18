const mongoose = require('mongoose');

const classworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  standard: {
    type: String,
    required: true
  },
  batch: {
    type: String,
    trim: true
  },
  fileUrl: {
    type: String,
    trim: true
  },
  fileName: {
    type: String,
    trim: true
  },
  content: {
    type: String
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploaderName: {
    type: String,
    trim: true
  },
  uploaderRole: {
    type: String,
    enum: ['admin', 'faculty']
  }
}, { timestamps: true });

module.exports = mongoose.model('Classwork', classworkSchema);
