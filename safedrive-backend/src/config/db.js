const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI ortam değişkeni tanımlı değil');
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB bağlandı: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB bağlantı hatası: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
