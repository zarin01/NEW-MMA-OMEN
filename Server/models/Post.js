const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const PostSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  body: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  categories: [{
    type: String
  }],
  headerImage: {
    type: String,
    required: true
  },
  ImageAlt: {
    type: String,
    required: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  likeCount: {
    type: Number,
    default: 0,
  },
  dislikeCount: {
    type: Number,
    default: 0,
  },
  likedBy: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  dislikedBy: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  keywords: [{
    type: String
  }], 
  metaDescription: {
    type: String,
    required: true
  },
  metaTitle: {
    type: String,
    required: true
  }, 
  readTime: {
    type: Number
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  ogTitle: { type: String, default: function() { return this.metaTitle; } },
  ogDescription: { type: String, default: function() { return this.metaDescription; } },
  ogImage: { type: String, default: function() { return this.headerImage; } }
});

module.exports = mongoose.model('Post', PostSchema);
