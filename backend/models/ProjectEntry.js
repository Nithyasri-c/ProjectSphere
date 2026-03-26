const mongoose = require('mongoose');

const ProjectEntrySchema = new mongoose.Schema({
  // Project identification
  projectId: {
    type: String,
    required: [true, 'Project ID is required'],
    trim: true,
    index: true
  },
  projectTitle: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true
  },
  
  // Students information (SEPARATE FROM GUIDE)
  students: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }
  }],
  
  // Guide information (KEPT SEPARATE - NOT IN STUDENTS ARRAY)
  internalGuide: {
    name: {
      type: String,
      required: [true, 'Guide name is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    guideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guide'
    }
  },
  
  // Project domain (e.g., Deep Learning, Image Processing)
  domain: {
    type: String,
    trim: true
  },
  
  // COE (Center of Excellence)
  coe: {
    name: {
      type: String,
      trim: true
    },
    coeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'COE'
    }
  },
  
  // RC (Resource Coordinator)
  rc: {
    name: {
      type: String,
      trim: true
    },
    rcId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RC'
    }
  },
  
  // Batch mapping (created when importing)
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  
  // Additional metadata
  department: {
    type: String,
    trim: true
  },
  year: {
    type: String,
    enum: ['2nd', '3rd', '4th']
  },
  branch: {
    type: String,
    enum: ['CSE', 'IT', 'ECE', 'CSM', 'EEE', 'CSD', 'ETM']
  },
  section: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E']
  },
  batch: {
    type: String,
    trim: true
  },
  
  // Import tracking
  importedAt: {
    type: Date,
    default: Date.now
  },
  importedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

// Index for multi-field search functionality
ProjectEntrySchema.index({ projectTitle: 'text', 'internalGuide.name': 'text', domain: 'text', 'coe.name': 'text', 'rc.name': 'text', 'students.name': 'text' });
ProjectEntrySchema.index({ projectId: 1, 'internalGuide.guideId': 1 });

module.exports = mongoose.model('ProjectEntry', ProjectEntrySchema);
