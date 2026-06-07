const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Company = require('../models/Company');

const router = express.Router();

const SALT_ROUNDS = 10;

// Kullanıcı (admin/driver) JWT üret — driver ise companyId de eklenir
const generateToken = (user) => {
  const payload = { userId: user._id, role: user.role, username: user.username };
  if (user.companyId) payload.companyId = user.companyId;
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Şirket JWT üret
const generateCompanyToken = (company) => {
  return jwt.sign(
    { companyId: company._id, role: 'company', name: company.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /auth/register
router.post(
  '/register',
  [
    body('username').notEmpty().withMessage('username zorunludur'),
    body('email').isEmail().withMessage('Geçerli bir email giriniz'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Şifre en az 6 karakter olmalıdır'),
    body('role')
      .optional()
      .isIn(['admin', 'driver'])
      .withMessage('Geçersiz rol'),
    body('companyId')
      .notEmpty()
      .withMessage('Şirket seçimi zorunludur')
      .isMongoId()
      .withMessage('Geçersiz şirket')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { username, email, password, role, companyId } = req.body;

      // Seçilen şirketin var olduğunu doğrula
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ error: 'Şirket bulunamadı' });
      }

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ error: 'Bu email zaten kayıtlı' });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        role: role || 'driver',
        companyId
      });

      const token = generateToken(user);

      return res.status(201).json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          companyId: user.companyId
        }
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: 'Kullanıcı adı veya email zaten kayıtlı' });
      }
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }
);

// POST /auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Geçerli bir email giriniz'),
    body('password').notEmpty().withMessage('Şifre zorunludur')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Email veya şifre hatalı' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: 'Email veya şifre hatalı' });
      }

      const token = generateToken(user);

      return res.status(200).json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          companyId: user.companyId
        }
      });
    } catch (err) {
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }
);

// POST /auth/register-company — Şirket kaydı
router.post(
  '/register-company',
  [
    body('name').notEmpty().withMessage('Şirket adı zorunludur'),
    body('email').isEmail().withMessage('Geçerli bir email giriniz'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Şifre en az 6 karakter olmalıdır')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { name, email, password } = req.body;

      const existing = await Company.findOne({ email });
      if (existing) {
        return res.status(409).json({ error: 'Bu email zaten kayıtlı' });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const company = await Company.create({
        name,
        email,
        password: hashedPassword
      });

      const token = generateCompanyToken(company);

      return res.status(201).json({
        token,
        company: { id: company._id, name: company.name, email: company.email }
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: 'Şirket adı veya email zaten kayıtlı' });
      }
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }
);

// POST /auth/login-company — Şirket girişi
router.post(
  '/login-company',
  [
    body('email').isEmail().withMessage('Geçerli bir email giriniz'),
    body('password').notEmpty().withMessage('Şifre zorunludur')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { email, password } = req.body;

      const company = await Company.findOne({ email });
      if (!company) {
        return res.status(401).json({ error: 'Email veya şifre hatalı' });
      }

      const match = await bcrypt.compare(password, company.password);
      if (!match) {
        return res.status(401).json({ error: 'Email veya şifre hatalı' });
      }

      const token = generateCompanyToken(company);

      return res.status(200).json({
        token,
        company: { id: company._id, name: company.name, email: company.email }
      });
    } catch (err) {
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }
);

module.exports = router;
