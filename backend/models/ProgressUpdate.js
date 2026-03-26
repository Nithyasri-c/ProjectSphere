const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  guideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guide',
    required: true
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const ProgressUpdateSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch is required']
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  fileUrl: {
    type: String,
    trim: true
  },
  commentThread: [CommentSchema]
}, { timestamps: true });

module.exports = mongoose.model('ProgressUpdate', ProgressUpdateSchema);

