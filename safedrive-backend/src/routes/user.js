const express = require('express');
const User = require('../models/User');
const Device = require('../models/Device');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/users — sadece admin. Şirket bilgisi populate edilir.
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('companyId', 'name');
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// PATCH /api/users/:id — sadece admin. username, email, role, companyId güncellenir.
router.patch('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { username, email, role, companyId } = req.body;

    const updates = {};
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) {
      if (!['admin', 'driver'].includes(role)) {
        return res.status(400).json({ error: 'Geçersiz rol' });
      }
      updates.role = role;
    }
    if (companyId !== undefined) {
      updates.companyId = companyId || null; // boş gönderilirse şirketi kaldır
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    })
      .select('-password')
      .populate('companyId', 'name');

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    return res.status(200).json(user);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Kullanıcı adı veya email zaten kayıtlı' });
    }
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// DELETE /api/users/:id — sadece admin. Kullanıcının cihazları da silinir.
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    // Admin kendini silmesin
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    // Bu kullanıcıya ait cihazları da temizle
    await Device.deleteMany({ owner: user._id });

    return res.status(200).json({ message: 'Kullanıcı ve cihazları silindi' });
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
