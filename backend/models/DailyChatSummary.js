const mongoose = require('mongoose');

const DailyChatSummarySchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
    index: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  participation: {
    guideParticipated: { type: Boolean, default: false },
    studentParticipated: { type: Boolean, default: false }
  }
}, { timestamps: true });

// Ensure unique summary per project per date
DailyChatSummarySchema.index({ projectId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyChatSummary', DailyChatSummarySchema);
