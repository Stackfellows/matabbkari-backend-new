const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Offer = require('../Models/Offer');
const { protect, adminOnly } = require('../Middelwares/authMiddleware');
const { uploadOfferImage } = require('../Middelwares/uploadMiddleware');
const { cacheMiddleware, cache } = require('../Middelwares/cacheMiddleware');

const { sendBroadcastEmail } = require('../utils/emailBroadcaster');

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

    // Clear cache so that the new offer appears immediately
    cache.flushAll();

    // Notify subscribers about the new offer (non-blocking)
    sendBroadcastEmail({
      subject: `New Special Offer: ${title} 🎁`,
      title: 'Exciting New Offer!',
      body: `**${title}**\n${subtitle}\n\n**Discount:** ${discountText}\n${expiryDate ? `**Valid until:** ${new Date(expiryDate).toLocaleDateString()}` : ''}\n\nDon't miss out on this amazing deal!`,
      imageUrl: image ? image.url : null
    }).catch(err => console.error('Offer notification error:', err));

    res.status(201).json({ success: true, data: offer });
  })
);

// @route   GET /api/offers
// @desc    Get all active offers
// @access  Public
router.get(
  '/',
  cacheMiddleware(300), // Cache offers for 5 minutes
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
    
    // Clear cache so that deletion is reflected
    cache.flushAll();
    
    res.json({ success: true, message: 'Offer removed' });
  })
);

module.exports = router;
