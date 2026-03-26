const mongoose = require('mongoose');

const COESchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'COE name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('COE', COESchema);

