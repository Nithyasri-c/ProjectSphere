const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    trim: true,
    unique: true
  },
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
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    default: null
  },
  role: {
    type: String,
    default: 'student'
  }
}, { timestamps: true });

// Hash password before saving
StudentSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
StudentSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Student', StudentSchema);

