const mongoose = require('mongoose');

const ratingAndReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: String,
    required: true,
  },
  review: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model('RatingAndReview', ratingAndReviewSchema);
