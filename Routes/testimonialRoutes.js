const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Testimonial = require('../Models/Testimonial');
const { protect, adminOnly } = require('../Middelwares/authMiddleware');
const { cacheMiddleware, cache } = require('../Middelwares/cacheMiddleware');

// @route   POST /api/testimonials
// @desc    Submit a new testimonial
// @access  Public
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, location, text, rating } = req.body;

    if (!name || !text || !rating) {
      res.status(400);
      throw new Error('Please provide name, feedback, and rating');
    }

    const testimonial = await Testimonial.create({
      name,
      location: location || 'Valued Customer',
      text,
      rating: Number(rating)
    });

    // Clear cache to show new feedback (if auto-approved, or just standard practice)
    cache.flushAll();

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! Your journey is now live.',
      data: testimonial
    });
  })
);

// @route   GET /api/testimonials
// @desc    Get all approved testimonials
// @access  Public
router.get(
  '/',
  cacheMiddleware(300), // Cache testimonials for 5 minutes
  asyncHandler(async (req, res) => {
    const testimonials = await Testimonial.find({ isApproved: true }).sort({ createdAt: -1 });
    res.json({ success: true, count: testimonials.length, data: testimonials });
  })
);

// @route   GET /api/testimonials/admin
// @desc    Get all testimonials (Admin)
// @access  Private/Admin
router.get(
  '/admin',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const testimonials = await Testimonial.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: testimonials.length, data: testimonials });
  })
);

// @route   PUT /api/testimonials/:id/approve
// @desc    Approve a testimonial
// @access  Private/Admin
router.put(
  '/:id/approve',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      res.status(404);
      throw new Error('Testimonial not found');
    }
    testimonial.isApproved = !testimonial.isApproved;
    await testimonial.save();
    
    // Clear cache so approval state reflects immediately
    cache.flushAll();
    
    res.json({ success: true, data: testimonial });
  })
);

// @route   DELETE /api/testimonials/:id
// @desc    Delete a testimonial
// @access  Private/Admin
router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      res.status(404);
      throw new Error('Testimonial not found');
    }
    await testimonial.deleteOne();
    
    // Clear cache
    cache.flushAll();
    
    res.json({ success: true, message: 'Testimonial removed' });
  })
);

module.exports = router;
