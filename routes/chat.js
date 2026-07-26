const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

// GET /api/chat/conversations — list users I've chatted with + last message + unread count
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const myId = new mongoose.Types.ObjectId(req.user.id);
    const convos = await Message.aggregate([
      { $match: { $or: [{ from: myId }, { to: myId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$from', myId] }, '$to', '$from']
          },
          lastMessage: { $first: '$content' },
          lastDate: { $first: '$createdAt' },
          unread: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$to', myId] }, { $eq: ['$read', false] }] }, 1, 0]
            }
          }
        }
      },
      { $sort: { lastDate: -1 } },
      { $limit: 50 }
    ]);

    const userIds = convos.map(c => c._id);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name username avatar')
      .lean();

    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const result = convos.map(c => ({
      user: userMap[c._id.toString()] || { _id: c._id, name: 'Deleted', username: 'deleted' },
      lastMessage: c.lastMessage.length > 60 ? c.lastMessage.slice(0, 60) + '...' : c.lastMessage,
      lastDate: c.lastDate,
      unread: c.unread
    }));

    res.json({ success: true, conversations: result });
  } catch (err) {
    console.error('Conversations error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/chat/unread — total unread message count (for badge)
router.get('/unread', requireAuth, async (req, res) => {
  try {
    const count = await Message.countDocuments({ to: req.user.id, read: false });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/chat/:userId — messages between me and userId (paginated)
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    const before = req.query.before;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 30));
    const myId = req.user.id;
    const otherId = req.params.userId;

    const match = {
      $or: [
        { from: myId, to: otherId },
        { from: otherId, to: myId }
      ]
    };
    if (before && mongoose.Types.ObjectId.isValid(before)) {
      match._id = { $lt: new mongoose.Types.ObjectId(before) };
    }

    const messages = await Message.find(match)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Mark incoming messages as read
    await Message.updateMany(
      { from: otherId, to: myId, read: false },
      { $set: { read: true } }
    );

    const other = await User.findById(otherId).select('name username avatar').lean();

    res.json({ success: true, messages: messages.reverse(), user: other });
  } catch (err) {
    console.error('Chat messages error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/chat/:userId — send a message
router.post('/:userId', requireAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ success: false, message: "You can't message yourself" });
    }

    const content = (req.body.content || '').trim();
    if (!content) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const other = await User.findById(req.params.userId).select('_id').lean();
    if (!other) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const message = await Message.create({
      from: req.user.id,
      to: req.params.userId,
      content
    });

    res.status(201).json({ success: true, message: message.toJSON() });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
