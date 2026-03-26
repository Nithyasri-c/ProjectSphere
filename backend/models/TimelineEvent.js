const mongoose = require('mongoose');

const TimelineEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  maxMarks: {
    type: Number,
    required: [true, 'Maximum marks is required'],
    min: 0
  },
  submissionRequirements: {
    type: String,
    trim: true
  },
  targetYear: {
    type: String,
    enum: ['2nd', '3rd', '4th', 'all'],
    default: 'all'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  referenceFile: {
    url: String,
    name: String
  },
  isMandatoryFormat: {
    type: Boolean,
    default: false
  },
  isMarksEnabled: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('TimelineEvent', TimelineEventSchema);

