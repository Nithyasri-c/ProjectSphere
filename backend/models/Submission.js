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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const AdminRemarkSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  remark: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const VersionSchema = new mongoose.Schema({
  version: {
    type: Number,
    required: true
  },
  // New field for Drive links
  driveLink: {
    type: String,
    trim: true
  },
  // Old fields for backward compatibility
  fileUrl: {
    type: String,
    trim: true
  },
  fileName: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const SubmissionSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  timelineEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimelineEvent',
    required: true
  },
  versions: [VersionSchema],
  currentVersion: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['not_started', 'submitted', 'under_review', 'needs_revision', 'accepted', 'rejected'],
    default: 'not_started'
  },
  comments: [CommentSchema],
  adminRemarks: [AdminRemarkSchema],
  marks: {
    type: Number,
    default: null
  },
  marksAssignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guide'
  },
  marksAssignedAt: {
    type: Date
  }
}, { timestamps: true });

// Compound index to ensure one submission per batch per event
SubmissionSchema.index({ batchId: 1, timelineEventId: 1 }, { unique: true });
// Single index for faster filtering by timeline event
SubmissionSchema.index({ timelineEventId: 1 });
// Index for faster pagination
SubmissionSchema.index({ timelineEventId: 1, createdAt: -1 });

module.exports = mongoose.model('Submission', SubmissionSchema);

