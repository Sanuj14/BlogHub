const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Blog = require('../models/Blog');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// GET /api/users/suggestions – people to follow (excludes self + already-followed)
router.get('/suggestions', optionalAuth, async (req, res) => {
  try {
    let exclude = [];
    if (req.user) {
      const me = await User.findById(req.user.id).select('following').lean();
      exclude = [req.user.id, ...(me && me.following ? me.following : [])];
    }
    const users = await User.find({ _id: { $nin: exclude } })
      .select('name username avatar createdAt')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/users/:id/follow – toggle follow/unfollow
router.post('/:id/follow', requireAuth, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: "You can't follow yourself" });
    }
    const [me, target] = await Promise.all([
      User.findById(req.user.id),
      User.findById(req.params.id)
    ]);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    const already = me.following.some(id => id.toString() === req.params.id);
    if (already) {
      me.following.pull(req.params.id);
      target.followers.pull(req.user.id);
    } else {
      me.following.push(req.params.id);
      target.followers.push(req.user.id);
    }
    await Promise.all([me.save(), target.save()]);
    res.json({ success: true, following: !already, followersCount: target.followers.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/users/me/counts – following + followers counts for dashboard
router.get('/me/counts', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('following followers').lean();
    res.json({ success: true, following: user.following.length, followers: user.followers.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/users/:id – public profile: user info, follower/following counts,
// whether the viewer follows them, and their published blogs.
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    const user = await User.findById(req.params.id)
      .select('name username avatar bio createdAt following followers')
      .lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isSelf = req.user && req.user.id === req.params.id;
    const isFollowing = req.user
      ? (user.followers || []).some(id => id.toString() === req.user.id)
      : false;

    const blogs = await Blog.find({ author: req.params.id, status: 'published' })
      .populate('author', 'name username avatar')
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
        followingCount: (user.following || []).length,
        followersCount: (user.followers || []).length
      },
      isSelf,
      isFollowing,
      blogs
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
