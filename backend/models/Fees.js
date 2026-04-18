const mongoose = require('mongoose');

const feesSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  dueAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['paid', 'partial', 'due'],
    default: 'due'
  },
  payments: [{
    amount: Number,
    date: String,
    method: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'card', 'razorpay', 'online', 'other'],
      default: 'cash'
    },
    note: String
  }],
  standard: {
    type: String
  },
  batch: {
    type: String
  },
  academicYear: {
    type: String,
    default: '2025-2026'
  }
}, { timestamps: true });

module.exports = mongoose.model('Fees', feesSchema);
