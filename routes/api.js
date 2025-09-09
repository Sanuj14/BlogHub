const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const { check, validationResult } = require('express-validator');
const Blog = require('../models/Blog');
const User = require('../models/User');
const Comment = require('../models/Comment');

// Get featured blogs
router.get('/blogs/featured', async (req, res) => {
  try {
    const blogs = await Blog.find({ featured: true, status: 'published' })
      .populate('author', 'name avatar')
      .sort({ date: -1 })
      .limit(5);
    
    res.json({ success: true, blogs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get latest blogs
router.get('/blogs/latest', async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' })
      .populate('author', 'name avatar')
      .sort({ date: -1 })
      .limit(6);
    
    res.json({ success: true, blogs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get blog comments
router.get('/blogs/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ 
      blog: req.params.id,
      parentComment: null
    })
      .populate('user', 'name avatar')
      .sort({ date: -1 });
    
    // Get replies for each comment
    const commentsWithReplies = await Promise.all(comments.map(async (comment) => {
      const replies = await Comment.find({ parentComment: comment._id })
        .populate('user', 'name avatar')
        .sort({ date: 1 });
      
      return {
        ...comment.toObject(),
        replies
      };
    }));
    
    res.json({ success: true, comments: commentsWithReplies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Like or unlike a blog
router.post('/blogs/:id/like', ensureAuthenticated, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    
    // Check if already liked
    const likedIndex = blog.likes.findIndex(
      like => like.toString() === req.user.id
    );
    
    if (likedIndex === -1) {
      // Not liked, add like
      blog.likes.push(req.user.id);
      blog.likesCount = blog.likes.length;
    } else {
      // Already liked, remove like
      blog.likes.splice(likedIndex, 1);
      blog.likesCount = blog.likes.length;
    }
    
    await blog.save();
    
    res.json({ 
      success: true, 
      likesCount: blog.likesCount,
      isLiked: likedIndex === -1 // True if like was added, false if removed
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Like or unlike a comment
router.post('/comments/:id/like', ensureAuthenticated, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    
    // Check if already liked
    const likedIndex = comment.likes.findIndex(
      like => like.toString() === req.user.id
    );
    
    if (likedIndex === -1) {
      // Not liked, add like
      comment.likes.push(req.user.id);
      comment.likesCount = comment.likes.length;
    } else {
      // Already liked, remove like
      comment.likes.splice(likedIndex, 1);
      comment.likesCount = comment.likes.length;
    }
    
    await comment.save();
    
    res.json({ 
      success: true, 
      likesCount: comment.likesCount,
      isLiked: likedIndex === -1 // True if like was added, false if removed
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Search blogs
router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.q;
    
    if (!searchTerm) {
      return res.json({ success: true, blogs: [] });
    }
    
    const searchRegex = new RegExp(searchTerm, 'i');
    
    const blogs = await Blog.find({
      $or: [
        { title: searchRegex },
        { content: searchRegex },
        { tags: searchRegex }
      ],
      status: 'published'
    })
      .populate('author', 'name avatar')
      .sort({ date: -1 })
      .limit(10);
    
    res.json({ success: true, blogs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get blog statistics
router.get('/blogs/:id/stats', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    
    res.json({
      success: true,
      stats: {
        views: blog.views,
        likes: blog.likesCount,
        comments: blog.commentsCount
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 