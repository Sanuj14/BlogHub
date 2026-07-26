const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

MessageSchema.index({ from: 1, to: 1, createdAt: -1 });
MessageSchema.index({ to: 1, read: 1 });

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema);
