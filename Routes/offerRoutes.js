const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Offer = require('../Models/Offer');
const { protect, adminOnly } = require('../Middelwares/authMiddleware');
const { uploadOfferImage } = require('../Middelwares/uploadMiddleware');

// @route   POST /api/offers
// @desc    Add a new offer (Admin)
// @access  Admin
router.post(
  '/',
  protect,
  adminOnly,
  uploadOfferImage.single('image'),
  asyncHandler(async (req, res) => {
    const { title, subtitle, discountText, link, expiryDate } = req.body;
    
    const image = req.file ? {
      public_id: req.file.filename,
      url: req.file.path
    } : null;

    const offer = await Offer.create({
      title,
      subtitle,
      discountText,
      link,
      expiryDate,
      image
    });

    res.status(201).json({ success: true, data: offer });
  })
);

// @route   GET /api/offers
// @desc    Get all active offers
// @access  Public
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const offers = await Offer.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: offers });
  })
);

// @route   DELETE /api/offers/:id
// @desc    Delete an offer
// @access  Admin
router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      res.status(404);
      throw new Error('Offer not found');
    }
    await offer.deleteOne();
    res.json({ success: true, message: 'Offer removed' });
  })
);

module.exports = router;
