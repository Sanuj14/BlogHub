const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { requireAuth, signToken } = require('../middleware/auth');

const emailRe = /^\S+@\S+\.\S+$/;

function makeTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    let { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }
    username = String(username).trim().toLowerCase();
    email = String(email).trim().toLowerCase();

    if (!/^[a-zA-Z0-9_]{3,}$/.test(username)) {
      return res
        .status(400)
        .json({ success: false, message: 'Username must be 3+ characters (letters, numbers, underscores)' });
    }
    if (!emailRe.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      const field = existing.email === email ? 'Email' : 'Username';
      return res.status(409).json({ success: false, message: `${field} is already registered` });
    }

    const user = await User.create({ name: name.trim(), username, email, password });
    const token = signToken(user);

    res.status(201).json({
      success: true,
      token: 'Bearer ' + token,
      user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email or username already exists' });
    }
    if (err && err.name === 'ValidationError') {
      const message = Object.values(err.errors)[0].message;
      return res.status(400).json({ success: false, message });
    }
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+password');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(user);
    res.json({
      success: true,
      token: 'Bearer ' + token,
      user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/auth/me  – verify token / fetch current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/auth/profile – update the current user's username / avatar / name / bio
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { name, username, avatar, bio } = req.body;

    if (username !== undefined) {
      const next = String(username).trim().toLowerCase();
      if (!/^[a-zA-Z0-9_]{3,}$/.test(next)) {
        return res
          .status(400)
          .json({ success: false, message: 'Username must be 3+ characters (letters, numbers, underscores)' });
      }
      if (next !== user.username) {
        const taken = await User.findOne({ username: next, _id: { $ne: user._id } });
        if (taken) return res.status(409).json({ success: false, message: 'Username is already taken' });
        user.username = next;
      }
    }

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (trimmed.length < 2) {
        return res.status(400).json({ success: false, message: 'Name must be at least 2 characters long' });
      }
      user.name = trimmed;
    }

    if (avatar !== undefined) {
      const value = String(avatar).trim();
      // Accept an http(s) URL or a base64 image data URL picked from the gallery.
      if (value && !/^(https?:\/\/|data:image\/)/.test(value)) {
        return res.status(400).json({ success: false, message: 'Avatar must be an image URL or uploaded file' });
      }
      user.avatar = value;
    }

    if (bio !== undefined) user.bio = String(bio).trim().slice(0, 280);

    await user.save();

    // Issue a fresh token so the embedded name/username stay in sync.
    const token = signToken(user);
    res.json({
      success: true,
      message: 'Profile updated',
      token: 'Bearer ' + token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role
      }
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Username is already taken' });
    }
    if (err && err.name === 'ValidationError') {
      const message = Object.values(err.errors)[0].message;
      return res.status(400).json({ success: false, message });
    }
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/* --------------------------- password reset flow -------------------------- */

// POST /api/auth/forgot-password – generate a 6-digit code and email it
router.post('/forgot-password', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!emailRe.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email' });
    }

    const user = await User.findOne({ email });
    // Always respond the same way so we don't leak which emails exist.
    if (!user) {
      return res.json({ success: true, message: 'If that email is registered, a code has been sent.' });
    }

    const code = ('' + Math.floor(100000 + Math.random() * 900000)); // 6 digits
    user.resetCode = crypto.createHash('sha256').update(code).digest('hex');
    user.resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        await makeTransport().sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: 'Your BlogHub password reset code',
          text: `Your password reset code is ${code}. It expires in 15 minutes.`,
          html: `<p>Your BlogHub password reset code is:</p><h2 style="letter-spacing:4px">${code}</h2><p>It expires in 15 minutes. If you didn't request this, you can ignore this email.</p>`
        });
      } catch (mailErr) {
        console.error('Email send error:', mailErr.message);
        return res.status(500).json({ success: false, message: 'Could not send the email. Try again later.' });
      }
    } else {
      // No SMTP configured (e.g. local dev): log the code so the flow still works.
      console.log(`[DEV] Password reset code for ${email}: ${code}`);
    }

    res.json({ success: true, message: 'If that email is registered, a code has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/reset-password – verify the code and set a new password
router.post('/reset-password', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const code = String(req.body.code || '').trim();
    const password = String(req.body.password || '');

    if (!email || !code || !password) {
      return res.status(400).json({ success: false, message: 'Email, code and new password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email }).select('+resetCode +resetExpiry +password');
    if (!user || !user.resetCode || !user.resetExpiry) {
      return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    }
    if (user.resetExpiry.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'This code has expired. Request a new one.' });
    }

    const hashed = crypto.createHash('sha256').update(code).digest('hex');
    if (hashed !== user.resetCode) {
      return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    }

    user.password = password; // pre-save hook re-hashes it
    user.resetCode = undefined;
    user.resetExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
