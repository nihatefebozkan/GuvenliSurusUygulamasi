const express = require('express');
const Company = require('../models/Company');

const router = express.Router();

// GET /api/companies — Tüm şirketlerin sadece _id ve name'i (auth gerekmez).
// Mobil kayıt formundaki şirket dropdown'ı için kullanılır.
router.get('/', async (req, res) => {
  try {
    const companies = await Company.find().select('_id name').sort({ name: 1 });
    return res.status(200).json(companies);
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
