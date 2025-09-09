const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Simple login endpoint that doesn't use bcrypt
router.post('/login-simple', async (req, res) => {
  const { email, password } = req.body;
  
  console.log('Simple login attempt:', email);
  
  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    // Find user by email and explicitly select the password field
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // User matched, create JWT
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

    console.log('Login successful for user:', email);
    res.json({
      success: true,
      token: 'Bearer ' + token,
      user: payload
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Regular login endpoint with password verification
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', email);
  
  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    
    // Check if user exists
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // User matched, create JWT
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

    console.log('Login successful for user:', email);
    res.json({
      success: true,
      token: 'Bearer ' + token,
      user: payload
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Registration endpoint
router.post('/register', async (req, res) => {
  const { name, username, email, password } = req.body;
  
  console.log('Registration attempt:', { name, username, email });
  
  // Simple validation
  if (!name || !username || !email || !password) {
    console.log('Missing required fields:', { name, username, email, password });
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      console.log('User already exists:', { email, username });
      return res.status(400).json({ message: 'Email or username already exists' });
    }

    // Create new user - let the pre-save middleware handle password hashing
    user = new User({
      name,
      username,
      email,
      password
    });
    
    // Save user - this will trigger the pre-save middleware to hash the password
    await user.save();
    console.log('User created successfully:', { id: user.id, username: user.username });

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

    console.log('Registration successful, sending response');
    res.status(201).json({
      success: true,
      token: 'Bearer ' + token,
      user: payload
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  console.log('Forgot password request:', email);
  
  // Simple validation
  if (!email) {
    return res.status(400).json({ message: 'Please provide your email address' });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // In a real app, you'd generate a token and send email
    // For demo purposes, just return success
    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  
  console.log('Reset password attempt with token:', token);
  
  // Simple validation
  if (!token || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // In a real app, you'd verify the token and find the user
    // For demo purposes just return success
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint to verify token
router.get('/verify-token', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false,
      message: 'No token provided' 
    });
  }
  
  try {
    // Extract the token
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bloghub_jwt_secret');
    
    // Find the user to ensure they still exist
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Generate a new token for the user
    const newToken = jwt.sign(
      {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'bloghub_jwt_secret',
      { expiresIn: '1d' }
    );
    
    // Return success with user info and new token
    res.json({
      success: true,
      message: 'Token is valid',
      token: 'Bearer ' + newToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Token verification error:', err.message);
    
    // Return detailed error for debugging
    return res.status(401).json({ 
      success: false,
      message: 'Invalid token', 
      error: err.message
    });
  }
});

module.exports = router; 