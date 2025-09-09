const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ensureAuthenticated, authenticateJWT } = require('../config/auth');
const { check, validationResult } = require('express-validator');
const Blog = require('../models/Blog');
const User = require('../models/User');
const Comment = require('../models/Comment');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads with disk storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get featured blogs
router.get('/featured', async (req, res) => {
  try {
    // Return the first 3 sample blogs as featured
    const blogs = [
      {
        _id: '1',
        title: 'The Future of Artificial Intelligence in Healthcare',
        content: 'Exploring how AI technologies are revolutionizing medical diagnoses, treatment plans, and patient care in modern healthcare systems.',
        category: 'Technology',
        tags: ['AI', 'Healthcare', 'Innovation'],
        author: { name: 'Arjun Kapoor', avatar: '/img/default-avatar.png' },
        createdAt: new Date('2025-04-09'),
        image: 'https://source.unsplash.com/random/600x400?healthcare',
        views: 150
      },
      {
        _id: '2',
        title: 'Hidden Gems of Northeast India: Unexplored Paradise',
        content: 'Discover the breathtaking landscapes, rich cultural heritage, and unique experiences waiting in the lesser-known regions of Northeast India.',
        category: 'Travel',
        tags: ['Travel', 'India', 'Adventure'],
        author: { name: 'Priya Sharma', avatar: '/img/default-avatar.png' },
        createdAt: new Date('2025-04-08'),
        image: 'https://source.unsplash.com/random/600x400?india',
        views: 200
      },
      {
        _id: '3',
        title: 'Traditional Indian Street Foods You Must Try',
        content: 'A culinary journey through the vibrant streets of India, exploring iconic street foods that have captured the hearts and taste buds of people worldwide.',
        category: 'Food',
        tags: ['Food', 'Street Food', 'Culture'],
        author: { name: 'Rahul Mehta', avatar: '/img/default-avatar.png' },
        createdAt: new Date('2025-04-07'),
        image: 'https://source.unsplash.com/random/600x400?food',
        views: 180
      }
    ];
    
    return res.json(blogs);
  } catch (err) {
    console.error('Error fetching featured blogs:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured blogs',
      error: err.message 
    });
  }
});

// Get all blogs
router.get('/', async (req, res) => {
  try {
    // Sample blogs for testing
    const blogs = [
  {
    _id: '1',
    title: 'The Future of Artificial Intelligence in Healthcare',
    content: 'Exploring how AI technologies are revolutionizing medical diagnoses, treatment plans, and patient care in modern healthcare systems.',
    category: 'Technology',
    tags: ['AI', 'Healthcare', 'Innovation'],
    author: { name: 'Arjun Kapoor', avatar: '/img/default-avatar.png' },
    createdAt: new Date('2025-04-09'),
    image: 'https://source.unsplash.com/featured/?healthcare,technology',
    views: 150
  },
  {
    _id: '2',
    title: 'Hidden Gems of Northeast India: Unexplored Paradise',
    content: 'Discover the breathtaking landscapes, rich cultural heritage, and unique experiences waiting in the lesser-known regions of Northeast India.',
    category: 'Travel',
    tags: ['Travel', 'India', 'Adventure'],
    author: { name: 'Priya Sharma', avatar: '/img/default-avatar.png' },
    createdAt: new Date('2025-04-08'),
    image: 'https://source.unsplash.com/featured/?india,travel',
    views: 200
  },
  {
    _id: '3',
    title: 'Traditional Indian Street Foods You Must Try',
    content: 'A culinary journey through the vibrant streets of India, exploring iconic street foods that have captured the hearts and taste buds of people worldwide.',
    category: 'Food',
    tags: ['Food', 'Street Food', 'Culture'],
    author: { name: 'Rahul Mehta', avatar: '/img/default-avatar.png' },
    createdAt: new Date('2025-04-07'),
    image: 'https://source.unsplash.com/featured/?food,indian',
    views: 180
  },
  {
    _id: '4',
    title: 'Mastering Remote Work: Tips & Tools',
    content: 'Remote work is here to stay. Learn how to maximize productivity and maintain work-life balance from anywhere.',
    category: 'Lifestyle',
    tags: ['Remote Work', 'Productivity'],
    author: { name: 'Simran Kaur', avatar: '/img/default-avatar.png' },
    createdAt: new Date('2025-04-06'),
    image: 'https://source.unsplash.com/random/600x400?remote',
    views: 130
  },
  {
    _id: '5',
    title: 'The Rise of Electric Vehicles in India',
    content: 'An in-depth look at the growing electric vehicle market in India, government initiatives, challenges, and the road ahead for sustainable transportation.',
    category: 'Technology',
    tags: ['EV', 'Sustainability', 'India'],
    author: { name: 'Amit Verma', avatar: '/img/default-avatar.png' },
    createdAt: new Date('2025-04-05'),
    image: 'https://source.unsplash.com/featured/?electric,vehicle',
    views: 210
  },
  {
    _id: '6',
    title: 'Yoga for a Healthy Mind and Body',
    content: 'Discover the benefits of yoga and how it can help you achieve a healthier lifestyle, both mentally and physically.',
    category: 'Lifestyle',
    tags: ['Yoga', 'Health', 'Wellness'],
    author: { name: 'Neha Joshi', avatar: '/img/default-avatar.png' },
    createdAt: new Date('2025-04-04'),
    image: 'https://source.unsplash.com/featured/?yoga,wellness',
    views: 175
  }
];
    
    res.json(blogs);
  } catch (err) {
    console.error('Error fetching blogs:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching blogs',
      error: err.message 
    });
  }
});

// Get new blog form
router.get('/new', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/create-blog.html'));
});

// Get user blogs - moved before /:id route
router.get('/user', authenticateJWT, async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user.id })
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar bio')
      .lean();
    
    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      blogs
    });
  } catch (err) {
    console.error('Error fetching user blogs:', err);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
      success: false,
      message: 'Error fetching user blogs',
      error: err.message
    });
  }
});

// Get single blog
router.get('/:id', async (req, res) => {
  try {
    console.log('Fetching blog by ID:', req.params.id);

    // Special case for featured blogs
    if (req.params.id === 'featured') {
      // Return the first 3 sample blogs as featured
      const blogs = [
        {
          _id: '1',
          title: 'The Future of Artificial Intelligence in Healthcare',
          content: 'Exploring how AI technologies are revolutionizing medical diagnoses, treatment plans, and patient care in modern healthcare systems.',
          category: 'Technology',
          tags: ['AI', 'Healthcare', 'Innovation'],
          author: { name: 'Arjun Kapoor', avatar: '/img/default-avatar.png' },
          createdAt: new Date('2025-04-09'),
          image: 'https://source.unsplash.com/random/600x400?healthcare',
          views: 150
        },
        {
          _id: '2',
          title: 'Hidden Gems of Northeast India: Unexplored Paradise',
          content: 'Discover the breathtaking landscapes, rich cultural heritage, and unique experiences waiting in the lesser-known regions of Northeast India.',
          category: 'Travel',
          tags: ['Travel', 'India', 'Adventure'],
          author: { name: 'Priya Sharma', avatar: '/img/default-avatar.png' },
          createdAt: new Date('2025-04-08'),
          image: 'https://source.unsplash.com/random/600x400?india',
          views: 200
        },
        {
          _id: '3',
          title: 'Traditional Indian Street Foods You Must Try',
          content: 'A culinary journey through the vibrant streets of India, exploring iconic street foods that have captured the hearts and taste buds of people worldwide.',
          category: 'Food',
          tags: ['Food', 'Street Food', 'Culture'],
          author: { name: 'Rahul Mehta', avatar: '/img/default-avatar.png' },
          createdAt: new Date('2025-04-07'),
          image: 'https://source.unsplash.com/random/600x400?food',
          views: 180
        }
      ];
      
      return res.json({
        success: true,
        blogs: blogs
      });
    }
    
    // Validate ID format for normal blog IDs
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error('Invalid blog ID format:', req.params.id);
      return res.status(400).json({
        success: false,
        message: 'Invalid blog ID format',
        error: `Invalid blog ID format: ${req.params.id}`
      });
    }

    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name avatar bio')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'name avatar'
        }
      });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Increment view count
    blog.views += 1;
    const savedBlog = await blog.save();
    
    // Return the complete blog object with populated author
    const populatedBlog = await Blog.findById(savedBlog._id)
      .populate('author', 'name email')
      .lean()
      .exec();

    if (!populatedBlog) {
      console.error('Blog not found after population:', savedBlog._id);
      throw new Error('Blog not found after population');
    }

    // Ensure consistent response format
    const blogResponse = {
      _id: savedBlog._id.toString(),
      id: savedBlog._id.toString(),
      title: populatedBlog.title,
      content: populatedBlog.content,
      category: populatedBlog.category,
      author: populatedBlog.author,
      status: populatedBlog.status,
      coverImage: populatedBlog.coverImage,
      createdAt: populatedBlog.createdAt
    };

    // Get comments
    const comments = await Comment.find({ blog: blog._id, parentComment: null })
      .populate('user', 'name avatar')
      .sort({ date: -1 });

    // Get related blogs
    const relatedBlogs = await Blog.find({
      category: blog.category,
      _id: { $ne: blog._id },
      status: 'published'
    })
      .populate('author', 'name avatar')
      .limit(3);

    res.json({
      success: true,
      blog: populatedBlog,
      comments,
      relatedBlogs
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error fetching blog',
      error: err.message
    });
  }
});

// Create new blog
router.post('/', authenticateJWT, upload.single('coverImage'), async (req, res) => {
  try {
    console.log('--- BLOG CREATE ATTEMPT ---');
    console.log('req.user:', req.user);
    console.log('req.body:', req.body);
    if (req.file) console.log('req.file:', req.file);
    else console.log('No file uploaded.');
    console.log('Blog creation request received');
    console.log('Request user:', req.user);
    console.log('Request body keys:', Object.keys(req.body));
    
    // Validate user from token
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { title, content, category, status } = req.body;
    const userId = req.user._id; // Use _id directly from req.user

    // Validate required fields
    if (!title || !content || !category) {
      console.error('Missing required fields:', { 
        title: !!title,
        content: !!content,
        category: !!category
      });
      return res.status(400).json({
        success: false,
        message: 'Title, category, and content are required' 
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('Creating blog with data:', {
      title: title,
      category: category,
      author: userId,
      contentLength: content?.length
    });

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() + '-' + Date.now();

    // Create new blog post with validated data
    const blogData = {
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      author: userId,
      status: status || 'published',
      slug: slug
    };

    // Add cover image if uploaded
    if (req.file) {
      console.log('Cover image uploaded:', req.file.filename);
      blogData.coverImage = `/uploads/${req.file.filename}`;
    }

    // Add tags if provided
    if (req.body.tags) {
      try {
        blogData.tags = JSON.parse(req.body.tags);
        console.log('Tags parsed from JSON:', blogData.tags);
      } catch (e) {
        blogData.tags = req.body.tags.split(',').map(tag => tag.trim());
        console.log('Tags parsed from string:', blogData.tags);
      }
    }

    console.log('Final blog data:', blogData);

    try {
      console.log('Attempting to save blog with data:', blogData);

      // Create and save the blog
      const blog = new Blog(blogData);
      
      // Validate the blog document
      const validationError = blog.validateSync();
      if (validationError) {
        console.error('Blog validation error:', validationError);
        return res.status(400).json({
          success: false,
          message: 'Invalid blog data',
          errors: validationError.errors
        });
      }

      // Save the blog
      const savedBlog = await blog.save();
      const blogId = savedBlog._id.toString();
      console.log('Blog saved successfully:', {
        id: blogId,
        title: savedBlog.title
      });

      // Populate author details
      const populatedBlog = await Blog.findById(blogId)
        .populate('author', 'name email')
        .lean()
        .exec();

      if (!populatedBlog) {
        console.error('Blog not found after population:', blogId);
        throw new Error('Blog not found after population');
      }

      console.log('Blog populated successfully:', {
        id: populatedBlog._id,
        title: populatedBlog.title,
        author: populatedBlog.author?._id
      });

      // Ensure consistent response format with explicit ID field
      const blogResponse = {
        _id: blogId,
        id: blogId, // Add explicit id field for client compatibility
        title: populatedBlog.title,
        content: populatedBlog.content,
        category: populatedBlog.category,
        author: populatedBlog.author,
        status: populatedBlog.status,
        slug: populatedBlog.slug,
        coverImage: populatedBlog.coverImage,
        createdAt: populatedBlog.createdAt
      };

      console.log('Sending blog response:', {
        _id: blogResponse._id,
        id: blogResponse.id,
        title: blogResponse.title
      });

      res.status(201).json({
        success: true,
        message: 'Blog created successfully',
        blog: blogResponse
      });
    } catch (saveError) {
      console.error('Error saving blog:', saveError);
      throw new Error('Failed to save blog to database');
    }
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating blog post',
      error: error.message,
    });
  }
});

// Get edit blog form
router.get('/:id/edit', authenticateJWT, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Check if user is the author
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this blog'
      });
    }

    res.json({
      success: true,
      blog
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error fetching blog',
      error: err.message
    });
  }
});

// Update blog
router.put('/:id', authenticateJWT, [
  check('title', 'Title is required').not().isEmpty(),
  check('content', 'Content is required').not().isEmpty(),
  check('category', 'Category is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Check if user is the author
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this blog'
      });
    }

    const { title, content, category, tags, status } = req.body;

    // Process tags
    let tagArray = [];
    if (tags) {
      tagArray = tags.split(',').map(tag => tag.trim());
    }

    blog.title = title;
    blog.content = content;
    blog.category = category;
    blog.tags = tagArray;
    if (status) {
      blog.status = status;
    }

    await blog.save();

    res.json({
      success: true,
      message: 'Blog updated successfully',
      blog
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// Delete blog
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Check if user is the author
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this blog'
      });
    }

    // Delete all comments related to the blog
    await Comment.deleteMany({ blog: blog.id });

    // Delete blog
    await Blog.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Like blog
router.post('/:id/like', ensureAuthenticated, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    // Check if the blog has already been liked by the user
    const likedIndex = blog.likes.findIndex(
      like => like.toString() === req.user.id
    );

    if (likedIndex === -1) {
      // Add the like
      blog.likes.push(req.user.id);
      blog.likesCount += 1;
    } else {
      // Remove the like
      blog.likes.splice(likedIndex, 1);
      blog.likesCount -= 1;
    }

    await blog.save();
    
    // Return JSON for AJAX request
    return res.json({
      success: true,
      likesCount: blog.likesCount,
      isLiked: likedIndex === -1
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add comment
router.post('/:id/comments', ensureAuthenticated, [
  check('content', 'Comment cannot be empty').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    const newComment = new Comment({
      blog: req.params.id,
      user: req.user.id,
      content: req.body.content,
      parentComment: req.body.parentComment || null
    });

    await newComment.save();

    // Increment comment count on blog
    blog.commentsCount += 1;
    await blog.save();

    // Populate user info for response
    await newComment.populate('user', 'name avatar');

    // Return JSON for AJAX request
    return res.json({
      success: true,
      comment: newComment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete comment
router.delete('/comments/:id', ensureAuthenticated, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check if user is the author or admin
    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'User not authorized' });
    }

    // Get blog to update comment count
    const blog = await Blog.findById(comment.blog);

    // Delete any replies to this comment
    const replies = await Comment.find({ parentComment: comment._id });
    
    if (replies.length > 0) {
      await Comment.deleteMany({ parentComment: comment._id });
      blog.commentsCount -= replies.length;
    }

    await comment.deleteOne();
    
    // Decrement comment count
    blog.commentsCount -= 1;
    await blog.save();

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Test endpoint to verify authentication
router.post('/verify-token', authenticateJWT, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const user = await User.findById(req.user._id).select('name email');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Token verified successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
});

// Simple test endpoint to create a blog without file upload
router.post('/test-create', authenticateJWT, async (req, res) => {
  try {
    console.log('Test blog creation request received');
    console.log('Request user:', req.user);
    console.log('Request body:', req.body);

    const { title, content } = req.body;
    const userId = req.user.id;

    // Validate minimal required fields
    if (!title || !content) {
      return res.status(400).json({ 
        success: false,
        message: 'Title and content are required' 
      });
    }

    // Generate slug from title
    let slug = title.toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
    
    // Add timestamp to ensure uniqueness
    slug = `${slug}-${Date.now()}`;

    // Create new blog post with validated data
    const blogData = {
      title: req.body.title,
      content: req.body.content,
      category: 'Test',
      author: req.user._id,
      status: 'published'
    };

    const blog = new Blog(blogData);

    // Create the blog
    const savedBlog = await blog.save();

    // Populate author details
    const populatedBlog = await Blog.findById(savedBlog._id)
      .populate('author', 'name email')
      .exec();

    res.status(201).json({
      success: true,
      message: 'Test blog post created successfully',
      blog: {
        id: populatedBlog._id,
        title: populatedBlog.title,
        content: populatedBlog.content,
        category: populatedBlog.category,
        author: populatedBlog.author,
        status: populatedBlog.status,
        createdAt: populatedBlog.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating test blog:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating test blog post',
      error: error.message 
    });
  }
});

module.exports = router; 