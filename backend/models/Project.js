const mongoose = require('mongoose');

/**
 * Unified Project Schema
 * Stores data extracted from multiple Excel files with different schemas
 * Fields: Team Name, Student Names, Guide Name, Project Title, COE
 */
const ProjectSchema = new mongoose.Schema({
  batchId: {
    type: String,
    trim: true,
    default: 'N/A'
  },
  teamName: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true
  },
  students: [{
    type: String,
    trim: true
  }],
  rollNumbers: [{
    type: String,
    trim: true
  }],
  guideName: {
    type: String,
    required: [true, 'Guide name is required'],
    trim: true
  },
  projectTitle: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true
  },
  researchArea: {
    type: String,
    trim: true,
    default: 'N/A'
  },
  coe: {
    type: String,
    trim: true,
    default: 'N/A'
  },
  // Metadata
  source: {
    type: String,
    enum: ['excel_import', 'manual'],
    default: 'excel_import'
  },
  importedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  // Create indexes for search performance
  indexes: [
    { guideName: 'text', projectTitle: 'text' }
  ]
});

// Create text index for smart search
ProjectSchema.index({ guideName: 'text', projectTitle: 'text' });

// Instance method to get formatted student list
ProjectSchema.methods.getStudentList = function () {
  return this.students.filter(s => s && s.trim()).join(', ');
};

module.exports = mongoose.model('Project', ProjectSchema);
