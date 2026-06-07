const express = require('express');
const { body, validationResult } = require('express-validator');
const Device = require('../models/Device');
const SensorData = require('../models/SensorData');
const Alarm = require('../models/Alarm');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/devices
// Admin tüm cihazları, şirket yalnızca kendi araçlarını, driver kendi cihazlarını görür.
router.get('/', auth, async (req, res) => {
  try {
    let filter;
    if (req.user.role === 'company') {
      // Güvenlik: companyId token'dan alınır, query param'a güvenilmez
      filter = { companyId: req.user.companyId };
    } else if (req.user.role === 'admin') {
      filter = {};
    } else {
      filter = { owner: req.user.userId };
    }

    const devices = await Device.find(filter)
      .populate('owner', 'username email role')
      .populate('companyId', 'name');
    return res.status(200).json(devices);
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// POST /api/devices
router.post(
  '/',
  auth,
  [
    body('deviceId').notEmpty().withMessage('deviceId zorunludur'),
    body('platform')
      .optional()
      .isIn(['android', 'ios', 'web'])
      .withMessage('Geçersiz platform')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { deviceId, model, platform, owner, companyId } = req.body;

      // Admin owner ve companyId'yi seçer; sürücü için bunlar token'dan alınır
      const finalOwner = req.user.role === 'admin' ? owner : req.user.userId;
      const finalCompany = req.user.role === 'admin' ? companyId : req.user.companyId;

      if (!finalOwner) {
        return res.status(400).json({ error: 'Sahip (sürücü) seçilmelidir' });
      }
      if (!finalCompany) {
        return res.status(400).json({ error: 'Şirket seçilmelidir' });
      }

      const existing = await Device.findOne({ deviceId });
      if (existing) {
        return res.status(409).json({ error: 'Bu deviceId zaten kayıtlı' });
      }

      const device = await Device.create({
        deviceId,
        model,
        platform,
        owner: finalOwner,
        companyId: finalCompany
      });

      return res.status(201).json(device);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: 'Bu deviceId zaten kayıtlı' });
      }
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }
);

// PATCH /api/devices/:id — sadece admin. deviceId, model, platform, owner, companyId güncellenir.
router.patch('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { deviceId, model, platform, owner, companyId } = req.body;

    const updates = {};
    if (deviceId !== undefined) updates.deviceId = deviceId;
    if (model !== undefined) updates.model = model;
    if (platform !== undefined) {
      if (!['android', 'ios', 'web'].includes(platform)) {
        return res.status(400).json({ error: 'Geçersiz platform' });
      }
      updates.platform = platform;
    }
    if (owner !== undefined) updates.owner = owner;
    if (companyId !== undefined) updates.companyId = companyId;

    const device = await Device.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    })
      .populate('owner', 'username email role')
      .populate('companyId', 'name');

    if (!device) {
      return res.status(404).json({ error: 'Cihaz bulunamadı' });
    }

    return res.status(200).json(device);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Bu deviceId zaten kayıtlı' });
    }
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// DELETE /api/devices/:id — sadece admin. Cihazın sensör verileri ve alarmları da silinir.
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Cihaz bulunamadı' });
    }

    // İlişkili verileri temizle
    await SensorData.deleteMany({ deviceId: device._id });
    await Alarm.deleteMany({ deviceId: device._id });

    return res.status(200).json({ message: 'Cihaz ve ilişkili veriler silindi' });
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
