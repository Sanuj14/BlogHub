const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// GET /api/users/suggestions – people to follow (excludes self + already-followed)
router.get('/suggestions', optionalAuth, async (req, res) => {
  try {
    const exclude = req.user
      ? [req.user.id, ...(await User.findById(req.user.id).select('following').lean()).following]
      : [];
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

module.exports = router;
