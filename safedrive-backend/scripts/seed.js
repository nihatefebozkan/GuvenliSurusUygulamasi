// Tek seferlik veritabanı sıfırlama + seed script'i.
// Çalıştır: node scripts/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('../src/models/User');
const Company = require('../src/models/Company');
const Device = require('../src/models/Device');
const SensorData = require('../src/models/SensorData');
const Alarm = require('../src/models/Alarm');

const SALT = 10;

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB bağlandı');

  // 1) Her şeyi temizle
  await Promise.all([
    User.deleteMany({}),
    Company.deleteMany({}),
    Device.deleteMany({}),
    SensorData.deleteMany({}),
    Alarm.deleteMany({})
  ]);
  console.log('Tüm koleksiyonlar temizlendi');

  // 2) Tek admin
  const adminPass = await bcrypt.hash('admin123', SALT);
  const admin = await User.create({
    username: 'efe',
    email: 'efebozkn@gmail.com',
    password: adminPass,
    role: 'admin'
  });
  console.log('Admin oluşturuldu:', admin.email);

  // 3) Üç şirket
  const companyPass = await bcrypt.hash('sirket123', SALT);
  const companies = [
    { name: 'Yıldız Lojistik', email: 'yildiz@lojistik.com' },
    { name: 'Aras Kargo', email: 'aras@lojistik.com' },
    { name: 'MNG Filo', email: 'mng@lojistik.com' }
  ];
  for (const c of companies) {
    await Company.create({ name: c.name, email: c.email, password: companyPass });
    console.log('Şirket oluşturuldu:', c.name, '-', c.email);
  }

  // Özet
  console.log('\n=== SONUÇ ===');
  console.log('Kullanıcı:', await User.countDocuments());
  console.log('Şirket:', await Company.countDocuments());
  console.log('Cihaz:', await Device.countDocuments());
  console.log('Sensör verisi:', await SensorData.countDocuments());
  console.log('Alarm:', await Alarm.countDocuments());

  await mongoose.disconnect();
  console.log('\nBitti.');
}

run().catch((err) => {
  console.error('Seed hatası:', err);
  process.exit(1);
});
