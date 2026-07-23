const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth, signToken } = require('../middleware/auth');

const emailRe = /^\S+@\S+\.\S+$/;

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

module.exports = router;
