const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  author: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  likeCount: {
    type: Number,
    default: 0,
  },
  dislikeCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Comment', CommentSchema);
