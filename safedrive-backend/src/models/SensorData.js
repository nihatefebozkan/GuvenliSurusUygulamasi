const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  accelerometer: {
    x: { type: Number },
    y: { type: Number },
    z: { type: Number }
  },
  gyroscope: {
    alpha: { type: Number },
    beta: { type: Number },
    gamma: { type: Number }
  },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    speed: { type: Number }
  }
});

module.exports = mongoose.model('SensorData', sensorDataSchema);
