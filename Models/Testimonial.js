const mongoose = require('mongoose');

const TestimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true
  },
  location: {
    type: String,
    default: 'Valued Customer'
  },
  text: {
    type: String,
    required: [true, 'Please provide your feedback'],
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  isApproved: {
    type: Boolean,
    default: true // Changed to true so it appears immediately
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Testimonial', TestimonialSchema);
