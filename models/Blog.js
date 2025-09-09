const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    unique: true
  },
  thumbnail: {
    type: String,
    default: '/img/placeholder.jpg'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Technology', 'Lifestyle', 'Travel', 'Food', 'Health', 'Business', 'Literature', 'Culture', 'Other']
  },
  tags: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  views: {
    type: Number,
    default: 0
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Remove the pre-save middleware that was causing issues
// BlogSchema.pre('save', function(next) {
//   // Always generate a slug if it doesn't exist
//   if (!this.slug) {
//     this.slug = this.title
//       .toLowerCase()
//       .replace(/[^a-zA-Z0-9]/g, '-')
//       .replace(/-+/g, '-')
//       .replace(/^-|-$/g, '');
//     
//     // Add timestamp to ensure uniqueness
//     this.slug = `${this.slug}-${Date.now()}`;
//   }
//   next();
// });

const Blog = mongoose.model('Blog', BlogSchema);

module.exports = Blog; 