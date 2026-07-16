const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { refreshToken } = require('../controllers/authController');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');

const ACCESS_SECRET = () => process.env.ACCESS_SECRET || 'access-secret';

const isEnvAdmin = (email, password) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return false;
  return email?.trim().toLowerCase() === adminEmail.trim().toLowerCase() && password === adminPassword;
};

const buildAdminUser = () => ({
  _id: 'admin',
  fullName: process.env.ADMIN_NAME || 'Admin',
  name: process.env.ADMIN_NAME || 'Admin',
  email: process.env.ADMIN_EMAIL,
  role: 'admin',
  status: 'approved',
});

const signAdminToken = () =>
  jwt.sign(
    { userId: 'admin', role: 'admin', isAdmin: true },
    ACCESS_SECRET(),
    { expiresIn: '1d' }
  );

// ------------------- Existing route -------------------
router.post('/refresh-token', refreshToken);

// ------------------- Signup Route -------------------
router.post('/register', async (req, res) => {
  console.log("Register API hit, body:", req.body);
  try {
    let { email, password, fullName } = req.body;
    if (email) {
      email = email.trim().toLowerCase();
      req.body.email = email;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const user = new User(req.body);
    await user.save();

    const token = jwt.sign({ userId: user._id },
      process.env.ACCESS_SECRET || 'access-secret', { expiresIn: '1d' });

    //SEND EMAIL AFTER SIGNUP
    const htmlMessage = `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Hello ${fullName},</h2>
        <p>Thank you for registering with <strong>Central Kitchen</strong>.</p>
        <p>Your details have been successfully submitted.</p>
        <p>
          Please wait while our admin reviews your registration.<br/>
          You will be notified once your account is approved.
        </p>
        <br/>
        <p>Regards,<br/>Central Kitchen Team</p>
      </div>
    `;

    await sendEmail(
      email,
      "Registration Received – Awaiting Approval",
      htmlMessage
    );

    res.status(201).json({
      message: 'User registered successfully.Confirmation email sent.',
      user: { _id: user._id, name: user.fullName, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    if (email) {
      email = email.trim().toLowerCase();
    }

    if (isEnvAdmin(email, password)) {
      const adminUser = buildAdminUser();
      return res.json({
        message: 'Login successful',
        user: {
          _id: adminUser._id,
          name: adminUser.name,
          fullName: adminUser.fullName,
          email: adminUser.email,
          role: adminUser.role,
        },
        token: signAdminToken(),
      });
    }

    if (process.env.ADMIN_EMAIL && email && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'user not exist' });

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is still pending approval' });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ userId: user._id }, ACCESS_SECRET(), { expiresIn: '1d' });

    res.json({
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.fullName,
        fullName: user.fullName,
        businessName: user.businessName,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------- Existing /me route -------------------
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET());
    req.userId = decoded.userId;
    req.auth = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.get('/me', verifyToken, async (req, res) => {
  try {
    if (req.auth?.isAdmin) {
      return res.json({ user: buildAdminUser() });
    }

    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------- Logout Route -------------------
router.post('/logout', (req, res) => {
  try {
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Server error during logout' });
  }
});


module.exports = router;
