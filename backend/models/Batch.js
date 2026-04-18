const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  standard: { type: String, required: true }
}, { timestamps: true });

// Prevent duplicate batches with the same name in the same standard
batchSchema.index({ name: 1, standard: 1 }, { unique: true });

module.exports = mongoose.model('Batch', batchSchema);
