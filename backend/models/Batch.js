const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  batchId: {
    type: String,
    unique: true,
    sparse: true, // Allows null values while maintaining uniqueness for non-null values
    trim: true
  },
  leaderStudentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    default: null  // CHANGED: No longer required
  },
  teamName: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true
  },
  // Year, Branch, Section - inherited from student leader
  year: {
    type: String,
    enum: ['2nd', '3rd', '4th'],
    required: [true, 'Year is required']
  },
  branch: {
    type: String,
    enum: ['CSE', 'IT', 'ECE', 'CSM', 'EEE', 'CSD', 'ETM'],
    required: [true, 'Branch is required']
  },
  section: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E'],
    required: [true, 'Section is required']
  },
  
  // Project Domain (from Excel import)
  domain: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Research Area (from Excel import or problem statement)
  researchArea: {
    type: String,
    trim: true,
    index: true,
    default: ''
  },
  
  // COE (Center of Excellence) - from Excel import
  coe: {
    name: {
      type: String,
      trim: true,
      default: ''
    },
    coeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'COE',
      default: null
    }
  },
  
  // RC (Resource Coordinator) - from Excel import
  rc: {
    name: {
      type: String,
      trim: true,
      default: ''
    },
    rcId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RC',
      default: null
    }
  },
  
  // Multiple opted problems (up to 3)
  optedProblems: [{
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProblemStatement'
    },
    coeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'COE'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    optedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Keep for backward compatibility - the single opted problem
  optedProblemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProblemStatement',
    default: null
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProblemStatement',
    default: null
  },
  guideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guide',
    default: null
  },
  coeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'COE',
    default: null
  },
  allotmentStatus: {
    type: String,
    enum: ['none', 'pending', 'allotted', 'rejected'],
    default: 'none'
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'Not Started'
  }
}, { timestamps: true });

// Index for search
BatchSchema.index({ teamName: 'text', domain: 'text', 'coe.name': 'text', 'rc.name': 'text' });

module.exports = mongoose.model('Batch', BatchSchema);

