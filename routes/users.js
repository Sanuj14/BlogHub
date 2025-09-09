const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const User = require('../models/User');
const { check, validationResult, body } = require('express-validator');
const path = require('path');
const auth = require('../middleware/auth');
const { register, login } = require('../controllers/userController');

// @route   GET /users/register
// @desc    Register page
// @access  Public
router.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/register.html'));
});

// @route   GET /users/login
// @desc    Login page
// @access  Public
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Registration validation middleware
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Registration route
router.post('/register', registerValidation, register);

// Login validation middleware
const loginValidation = [
  body('email').trim().notEmpty().withMessage('Email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Login route
router.post('/login', loginValidation, login);

// Logout Handle
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
  });
});

// Profile Page
router.get('/profile', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/profile.html'));
});

// Edit Profile
router.get('/edit-profile', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/edit-profile.html'));
});

// Update Profile
router.post('/edit-profile', ensureAuthenticated, [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail()
], async (req, res) => {
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
          errors: [{ msg: 'Email already in use' }]
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
});

// Change Password
router.get('/change-password', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/change-password.html'));
});

// Update Password
router.post('/change-password', ensureAuthenticated, [
  check('current', 'Current password is required').not().isEmpty(),
  check('password', 'New password must be at least 6 characters').isLength({ min: 6 }),
  check('password2').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], async (req, res) => {
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
        errors: [{ msg: 'Current password is incorrect' }]
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
});

// @route   GET /api/auth/user
// @desc    Get user data
// @access  Private
router.get('/api/auth/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 