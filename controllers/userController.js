const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Blog = require('../models/Blog');
const { validationResult } = require('express-validator');
const path = require('path');
const jwt = require('jsonwebtoken');

// Get register page
exports.getRegisterPage = (req, res) => {
  res.sendFile(path.join(__dirname, '../public/register.html'));
};

// Get login page
exports.getLoginPage = (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
};

// Register user
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, username, email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { username }] });

    if (user) {
      return res.status(400).json({ 
        success: false,
        message: 'Email or username already exists. Please use different credentials.'
      });
    }

    // Create new user
    user = new User({
      name,
      username,
      email,
      password
    });

    // Save user (password will be hashed by the pre-save middleware)
    await user.save();

    // Create JWT payload
    const payload = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role
    };

    // Sign token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'bloghub_jwt_secret',
      { expiresIn: '1d' }
    );

    res.status(201).json({
      success: true,
      token: 'Bearer ' + token,
      user: payload
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
};

// Log out user
exports.logoutUser = (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.json({
      success: true,
      message: 'You are logged out'
    });
  });
};

// Get profile page
exports.getProfilePage = async (req, res) => {
  try {
    // Get user's blogs
    const blogs = await Blog.find({ author: req.user.id })
      .sort({ date: -1 });
    
    res.sendFile(path.join(__dirname, '../public/profile.html'));
  } catch (err) {
    console.error(err);
    res.status(500).sendFile(path.join(__dirname, '../public/404.html'));
  }
};

// Get edit profile page
exports.getEditProfilePage = (req, res) => {
  res.sendFile(path.join(__dirname, '../public/edit-profile.html'));
};

// Update profile
exports.updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { name, email, bio } = req.body;
    
    // Check if email is already taken by another user
    if (email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Update user
    await User.findByIdAndUpdate(req.user.id, {
      name,
      email,
      bio
    });

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get change password page
exports.getChangePasswordPage = (req, res) => {
  res.sendFile(path.join(__dirname, '../public/change-password.html'));
};

// Update password
exports.updatePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { current, password } = req.body;
    
    // Check if current password is correct
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(current, user.password);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    await User.findByIdAndUpdate(req.user.id, {
      password: hashedPassword
    });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'bloghub_jwt_secret',
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          token: 'Bearer ' + token,
          user: payload
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
}; 