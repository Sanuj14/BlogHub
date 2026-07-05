const mongoose = require('mongoose');

const CATEGORIES = [
  'Technology',
  'Lifestyle',
  'Travel',
  'Food',
  'Health',
  'Business',
  'Literature',
  'Culture',
  'Other'
];

const CommentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 }
  },
  { timestamps: true }
);

const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    content: { type: String, required: true },
    excerpt: { type: String, default: '', maxlength: 300 },
    slug: { type: String, unique: true, index: true },
    coverImage: { type: String, default: '' }, // a URL – keeps the app serverless friendly
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true, enum: CATEGORIES, default: 'Other' },
    tags: [{ type: String, trim: true }],
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    views: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [CommentSchema]
  },
  { timestamps: true }
);

// Expose likeCount / commentCount when serialising to JSON.
BlogSchema.set('toJSON', { virtuals: true });
BlogSchema.set('toObject', { virtuals: true });
BlogSchema.virtual('likeCount').get(function () {
  return Array.isArray(this.likes) ? this.likes.length : 0;
});
BlogSchema.virtual('commentCount').get(function () {
  return Array.isArray(this.comments) ? this.comments.length : 0;
});

BlogSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.models.Blog || mongoose.model('Blog', BlogSchema);
module.exports.CATEGORIES = CATEGORIES;
