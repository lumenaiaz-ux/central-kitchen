const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL.trim());
    console.log('🟢 MongoDB connected:', mongoose.connection.name);
  } catch (err) {
    console.error('🔴 MongoDB connection failed:', err.message);
    // Keep API up so env-based admin login still works; DB routes will fail until reconnect
    console.error('⚠️  Server will keep running, but database-backed routes may fail.');
  }
};

module.exports = connectDB;