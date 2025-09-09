const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const { validationResult } = require('express-validator');

// Get all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    let query = { status: 'published' };
    let sort = { date: -1 };
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by tag
    if (req.query.tag) {
      query.tags = req.query.tag;
    }

    // Search by title or content
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { content: searchRegex }
      ];
    }

    // Sort options
    if (req.query.sort) {
      if (req.query.sort === 'popular') {
        sort = { views: -1 };
      } else if (req.query.sort === 'mostLiked') {
        sort = { likesCount: -1 };
      } else if (req.query.sort === 'mostCommented') {
        sort = { commentsCount: -1 };
      }
    }

    const blogs = await Blog.find(query)
      .populate('author', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const totalBlogs = await Blog.countDocuments(query);
    const totalPages = Math.ceil(totalBlogs / limit);

    res.render('blogs/index', {
      title: 'All Blogs - BlogHub',
      blogs,
      currentPage: page,
      totalPages,
      query: req.query
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Server error'
    });
  }
};

// Get single blog
exports.getBlogById = async (req, res) => {
  try {
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
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Blog not found'
      });
    }

    // Increment view count
    blog.views += 1;
    await blog.save();

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

    res.render('blogs/show', {
      title: `${blog.title} - BlogHub`,
      blog,
      comments,
      relatedBlogs
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Server error'
    });
  }
};

// Get create blog form
exports.getCreateBlogForm = (req, res) => {
  res.render('blogs/new', {
    title: 'Create New Blog - BlogHub'
  });
};

// Create new blog
exports.createBlog = async (req, res) => {
  // Check if user is authenticated and session is valid
  if (!req.isAuthenticated() || !req.session) {
    req.flash('error_msg', 'Your session has expired. Please log in again.');
    return res.redirect('/auth/login');
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('blogs/new', {
      title: 'Create New Blog - BlogHub',
      errors: errors.array(),
      formData: req.body
    });
  }

  try {
    const { title, content, category, tags, status } = req.body;

    // Process tags
    let tagArray = [];
    if (tags) {
      tagArray = tags.split(',').map(tag => tag.trim());
    }

    const newBlog = new Blog({
      title,
      content,
      category,
      tags: tagArray,
      author: req.user.id,
      status: status || 'published'
    });

    await newBlog.save();

    req.flash('success_msg', 'Blog created successfully');
    res.redirect(`/blogs/${newBlog.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Server error'
    });
  }
};

// Get edit blog form
exports.getEditBlogForm = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Blog not found'
      });
    }

    // Check if user is the author
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      req.flash('error_msg', 'You are not authorized to edit this blog');
      return res.redirect(`/blogs/${blog.id}`);
    }

    res.render('blogs/edit', {
      title: `Edit Blog: ${blog.title} - BlogHub`,
      blog
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Server error'
    });
  }
};

// Update blog
exports.updateBlog = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('blogs/edit', {
      title: 'Edit Blog - BlogHub',
      errors: errors.array(),
      blog: {
        ...req.body,
        _id: req.params.id
      }
    });
  }

  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Blog not found'
      });
    }

    // Check if user is the author
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      req.flash('error_msg', 'You are not authorized to edit this blog');
      return res.redirect(`/blogs/${blog.id}`);
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

    req.flash('success_msg', 'Blog updated successfully');
    res.redirect(`/blogs/${blog.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Server error'
    });
  }
};

// Delete blog
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Blog not found'
      });
    }

    // Check if user is the author
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      req.flash('error_msg', 'You are not authorized to delete this blog');
      return res.redirect(`/blogs/${blog.id}`);
    }

    // Delete all comments related to the blog
    await Comment.deleteMany({ blog: blog.id });

    // Delete blog
    await Blog.findByIdAndDelete(req.params.id);

    req.flash('success_msg', 'Blog deleted successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Server error'
    });
  }
};

// Like or unlike blog
exports.likeBlog = async (req, res) => {
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
};

// Add comment
exports.addComment = async (req, res) => {
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
};

// Delete comment
exports.deleteComment = async (req, res) => {
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
}; 