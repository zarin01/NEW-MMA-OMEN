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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Post', PostSchema);
