const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  model: {
    type: String
  },
  platform: {
    type: String,
    enum: ['android', 'ios', 'web']
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date
  }
});

module.exports = mongoose.model('Device', deviceSchema);
