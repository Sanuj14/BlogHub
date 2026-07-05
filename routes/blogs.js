const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const User = require('../models/User');
const { requireAuth, optionalAuth } = require('../middleware/auth');

function slugify(title) {
  return (
    String(title)
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) +
    '-' +
    Math.random().toString(36).slice(2, 8)
  );
}

function makeExcerpt(content) {
  return String(content).replace(/\s+/g, ' ').trim().slice(0, 200);
}

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
  return String(tags)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

/* ----------------------------- collection routes ----------------------------- */

// GET /api/blogs  – list published blogs with search / category / pagination
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit) || 9));
    const skip = (page - 1) * limit;

    const query = { status: 'published' };
    if (req.query.category) query.category = req.query.category;
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } },
        { tags: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate('author', 'name username avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      Blog.countDocuments(query)
    ]);

    res.json({
      success: true,
      blogs,
      total,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (err) {
    console.error('List blogs error:', err);
    res.status(500).json({ success: false, message: 'Error fetching blogs' });
  }
});

// GET /api/blogs/featured – newest published posts for the home page
router.get('/featured', async (req, res) => {
  try {
    const limit = Math.min(6, Math.max(1, parseInt(req.query.limit) || 4));
    const blogs = await Blog.find({ status: 'published' })
      .populate('author', 'name username avatar')
      .sort({ views: -1, createdAt: -1 })
      .limit(limit)
      .lean({ virtuals: true });
    res.json({ success: true, blogs });
  } catch (err) {
    console.error('Featured error:', err);
    res.status(500).json({ success: false, message: 'Error fetching featured blogs' });
  }
});

// GET /api/blogs/mine – the logged-in user's posts (drafts included)
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user.id })
      .populate('author', 'name username avatar')
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });
    res.json({ success: true, blogs });
  } catch (err) {
    console.error('My blogs error:', err);
    res.status(500).json({ success: false, message: 'Error fetching your blogs' });
  }
});

// POST /api/blogs – create
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, content, category, coverImage, status } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: 'Title, content and category are required' });
    }

    const blog = await Blog.create({
      title: title.trim(),
      content: content.trim(),
      excerpt: makeExcerpt(content),
      category,
      tags: normalizeTags(req.body.tags),
      coverImage: (coverImage || '').trim(),
      status: status === 'draft' ? 'draft' : 'published',
      author: req.user.id,
      slug: slugify(title)
    });

    const populated = await Blog.findById(blog._id)
      .populate('author', 'name username avatar')
      .lean({ virtuals: true });

    res.status(201).json({ success: true, message: 'Blog published!', blog: populated });
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      const message = Object.values(err.errors)[0].message;
      return res.status(400).json({ success: false, message });
    }
    console.error('Create blog error:', err);
    res.status(500).json({ success: false, message: 'Error creating blog post' });
  }
});

/* ------------------------------- item routes -------------------------------- */

// GET /api/blogs/:id – single post (+ related). Increments views.
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid blog id' });
    }

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('author', 'name username avatar bio')
      .populate('comments.user', 'name username avatar');

    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    const related = await Blog.find({
      category: blog.category,
      _id: { $ne: blog._id },
      status: 'published'
    })
      .populate('author', 'name username avatar')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean({ virtuals: true });

    const liked = req.user ? blog.likes.some((id) => id.toString() === req.user.id) : false;

    res.json({ success: true, blog: blog.toJSON(), related, liked });
  } catch (err) {
    console.error('Get blog error:', err);
    res.status(500).json({ success: false, message: 'Error fetching blog' });
  }
});

// PUT /api/blogs/:id – update (author/admin only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this blog' });
    }

    const { title, content, category, coverImage, status } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: 'Title, content and category are required' });
    }

    blog.title = title.trim();
    blog.content = content.trim();
    blog.excerpt = makeExcerpt(content);
    blog.category = category;
    blog.tags = normalizeTags(req.body.tags);
    if (coverImage !== undefined) blog.coverImage = String(coverImage).trim();
    if (status) blog.status = status === 'draft' ? 'draft' : 'published';

    await blog.save();
    const populated = await Blog.findById(blog._id)
      .populate('author', 'name username avatar')
      .lean({ virtuals: true });

    res.json({ success: true, message: 'Blog updated', blog: populated });
  } catch (err) {
    console.error('Update blog error:', err);
    res.status(500).json({ success: false, message: 'Error updating blog' });
  }
});

// DELETE /api/blogs/:id – delete (author/admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this blog' });
    }
    await blog.deleteOne();
    res.json({ success: true, message: 'Blog deleted' });
  } catch (err) {
    console.error('Delete blog error:', err);
    res.status(500).json({ success: false, message: 'Error deleting blog' });
  }
});

// POST /api/blogs/:id/like – toggle like
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    const idx = blog.likes.findIndex((id) => id.toString() === req.user.id);
    if (idx === -1) blog.likes.push(req.user.id);
    else blog.likes.splice(idx, 1);

    await blog.save();
    res.json({ success: true, liked: idx === -1, likeCount: blog.likes.length });
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/blogs/:id/comments – add comment
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const content = (req.body.content || '').trim();
    if (!content) return res.status(400).json({ success: false, message: 'Comment cannot be empty' });

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    blog.comments.push({ user: req.user.id, name: req.user.name, content });
    await blog.save();

    const comment = blog.comments[blog.comments.length - 1];
    res.status(201).json({ success: true, comment, commentCount: blog.comments.length });
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
