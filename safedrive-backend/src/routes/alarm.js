const express = require('express');
const Alarm = require('../models/Alarm');
const Device = require('../models/Device');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/alarms
// Driver sadece kendi cihazlarının alarmlarını, admin hepsini görür.
router.get('/', auth, async (req, res) => {
  try {
    const { deviceId, severity, resolved } = req.query;
    const filter = {};

    if (severity) filter.severity = severity;
    if (resolved !== undefined) filter.resolved = resolved === 'true';

    if (req.user.role === 'admin') {
      if (deviceId) filter.deviceId = deviceId;
    } else if (req.user.role === 'company') {
      // Şirket: kendi araçlarının alarmları (companyId güvenlik için token'dan)
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
      // Driver: sadece kendi cihazları
      const devices = await Device.find({ owner: req.user.userId }).select('_id');
      const ownedIds = devices.map((d) => d._id);

      if (deviceId) {
        const owns = ownedIds.some((id) => id.toString() === deviceId);
        if (!owns) {
          return res.status(403).json({ error: 'Bu cihaza erişim yetkiniz yok' });
        }
        filter.deviceId = deviceId;
      } else {
        filter.deviceId = { $in: ownedIds };
      }
    }

    const alarms = await Alarm.find(filter).sort({ timestamp: -1 });
    return res.status(200).json(alarms);
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// PATCH /api/alarms/:id — sadece admin
router.patch('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const alarm = await Alarm.findByIdAndUpdate(
      req.params.id,
      { resolved: true },
      { new: true }
    );

    if (!alarm) {
      return res.status(404).json({ error: 'Alarm bulunamadı' });
    }

    return res.status(200).json(alarm);
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
