const mongoose = require('mongoose');

const RCSchema = new mongoose.Schema({
  // RC (Resource Coordinator) Information
  name: {
    type: String,
    required: [true, 'RC name is required'],
    trim: true,
    unique: true,
    index: true
  },
  
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  
  department: {
    type: String,
    trim: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  // Track who created/updated
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Index for searching
RCSchema.index({ name: 'text', department: 'text' });

module.exports = mongoose.model('RC', RCSchema);
