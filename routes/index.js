const express = require('express');
const router = express.Router();
const path = require('path');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const { check, validationResult } = require('express-validator');
const Blog = require('../models/Blog');
const Contact = require('../models/Contact');
const User = require('../models/User');

// Home Page
router.get('/', async (req, res) => {
  try {
    // Get featured blogs
    const featuredBlogs = await Blog.find({ status: 'published' })
      .populate('author', 'name avatar')
      .sort({ views: -1 })
      .limit(3);
    
    // Get latest blogs
    const latestBlogs = await Blog.find({ status: 'published' })
      .populate('author', 'name avatar')
      .sort({ date: -1 })
      .limit(6);
    
    // Get popular categories
    const categories = await Blog.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Send the index.html file
    res.sendFile(path.join(__dirname, '../public/index.html'));
  } catch (err) {
    console.error(err);
    res.status(500).sendFile(path.join(__dirname, '../public/404.html'));
  }
});

// Dashboard Page
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    // Get user's blogs
    const blogs = await Blog.find({ author: req.user.id })
      .sort({ date: -1 });
    
    // Send the dashboard.html file
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
  } catch (err) {
    console.error(err);
    res.status(500).sendFile(path.join(__dirname, '../public/404.html'));
  }
});

// About Page
router.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/about.html'));
});

// Contact Page
router.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/contact.html'));
});

// Contact Form Submit
router.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  
  // Validate inputs
  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all fields'
    });
  }
  
  try {
    // In a real app, you would send an email here
    // For now, just return success
    res.json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Search Page
router.get('/search', async (req, res) => {
  try {
    const { q, type } = req.query;
    
    if (!q) {
      return res.sendFile(path.join(__dirname, '../public/search.html'));
    }
    
    let results = [];
    
    if (type === 'blogs' || !type) {
      // Search blogs
      results = await Blog.find({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { content: { $regex: q, $options: 'i' } }
        ],
        status: 'published'
      })
        .populate('author', 'name avatar')
        .sort({ date: -1 })
        .limit(10);
    } else if (type === 'users') {
      // Search users
      results = await User.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      })
        .select('name email avatar bio')
        .limit(10);
    }
    
    // Send the search.html file
    res.sendFile(path.join(__dirname, '../public/search.html'));
  } catch (err) {
    console.error(err);
    res.status(500).sendFile(path.join(__dirname, '../public/404.html'));
  }
});

module.exports = router; 