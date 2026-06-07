const express = require('express');
const { body, query, validationResult } = require('express-validator');
const SensorData = require('../models/SensorData');
const Alarm = require('../models/Alarm');
const Device = require('../models/Device');
const detectAnomaly = require('../services/anomalyDetector');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/sensor-data
router.post(
  '/',
  auth,
  [
    body('deviceId').notEmpty().withMessage('deviceId zorunludur'),
    body('timestamp').notEmpty().withMessage('timestamp zorunludur')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { deviceId, timestamp, accelerometer, gyroscope, location } = req.body;

      // deviceId'nin geçerli bir cihaza ait olduğunu doğrula
      const device = await Device.findById(deviceId);
      if (!device) {
        return res.status(404).json({ error: 'Cihaz bulunamadı' });
      }

      const sensorData = await SensorData.create({
        deviceId,
        timestamp,
        accelerometer,
        gyroscope,
        location
      });

      // Cihazın son görülme zamanını güncelle
      device.lastSeen = new Date();
      await device.save();

      // Anomali tespiti
      const anomaly = await detectAnomaly(sensorData);

      let alarm = null;
      if (anomaly) {
        alarm = await Alarm.create({
          deviceId: sensorData.deviceId,
          type: anomaly.type,
          severity: anomaly.severity,
          value: anomaly.value,
          timestamp: sensorData.timestamp
        });
      }

      // Socket.io eventleri
      const io = req.app.get('io');
      if (io) {
        io.emit('newData', sensorData);
        if (alarm) {
          io.emit('newAlarm', alarm);
        }
      }

      return res.status(201).json({ sensorData, alarm });
    } catch (err) {
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }
);

// GET /api/sensor-data
// - Şirket: kendi araçlarının verisi (companyId token'dan)
// - Admin/Driver: deviceId zorunlu
router.get('/', auth, async (req, res) => {
  try {
    const { deviceId, startDate, endDate } = req.query;
    const limit = parseInt(req.query.limit, 10) || 50;

    const filter = {};

    if (req.user.role === 'company') {
      // Şirkete ait cihazların id'lerini bul (companyId güvenlik için token'dan)
      const devices = await Device.find({ companyId: req.user.companyId }).select('_id');
      const ids = devices.map((d) => d._id);

      if (deviceId) {
        if (!ids.some((id) => id.toString() === deviceId)) {
          return res.status(403).json({ error: 'Bu araca erişim yetkiniz yok' });
        }
        filter.deviceId = deviceId;
      } else {
        filter.deviceId = { $in: ids };
      }
    } else {
      // Admin/Driver için deviceId zorunlu
      if (!deviceId) {
        return res.status(400).json({ error: 'deviceId zorunludur' });
      }
      filter.deviceId = deviceId;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const data = await SensorData.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit);

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
