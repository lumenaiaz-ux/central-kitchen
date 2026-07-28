const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db'); // ✅ MongoDB connection
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const slotRoutes = require('./routes/slotRoutes');
const contactRoutes = require('./routes/contactRoutes');
const dashboardRoutes=require('./routes/dashboardRoutes');
const shopRoutes=require('./routes/shopRoutes');
const categoryRoutes=require('./routes/categoryRoutes');
const publicUserRoutes=require('./routes/publicUserRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser tools (no Origin) and local CRA origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON body' });
  }
  return next(err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/stats',dashboardRoutes);
app.use('/api/shops',shopRoutes);
app.use('/api/categories',categoryRoutes);
app.use('/api/publicUser',publicUserRoutes);

// Health check route (optional)
app.get('/', (req, res) => {
  res.send('🚀 Central Kitchen API is running');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});