const express = require('express');
const { body, validationResult } = require('express-validator');
const Application = require('../models/Application');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/applications — Başvuru gönder (herkese açık, landing formu)
router.post(
  '/',
  [
    body('companyName').notEmpty().withMessage('Şirket adı zorunludur'),
    body('email').isEmail().withMessage('Geçerli bir email giriniz')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { companyName, contactName, email, phone, message } = req.body;

      const application = await Application.create({
        companyName,
        contactName,
        email,
        phone,
        message
      });

      return res.status(201).json({
        message: 'Başvurunuz alındı, en kısa sürede dönüş yapacağız.',
        id: application._id
      });
    } catch (err) {
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }
);

// GET /api/applications — Başvuruları listele (sadece admin)
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const applications = await Application.find().sort({ createdAt: -1 });
    return res.status(200).json(applications);
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// PATCH /api/applications/:id — İncelendi olarak işaretle (sadece admin)
router.patch('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { reviewed: true },
      { new: true }
    );
    if (!application) {
      return res.status(404).json({ error: 'Başvuru bulunamadı' });
    }
    return res.status(200).json(application);
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
